import os
import json
import warnings

# Try to load dotenv, but make it optional for Hugging Face Spaces
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("dotenv not available, using environment variables directly")

warnings.filterwarnings("ignore", message=".*validate_default.*")
warnings.filterwarnings("ignore", message=".*TRANSFORMERS_CACHE.*") 
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from dishka import AsyncContainer, make_async_container
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.database import DatabaseSettings
from config.ioc.di import get_providers
from config.logging import setup_logging
from config.ai_config import setup_ai_services, validate_ai_config
from presentation.api.rest.error_handling import setup_exception_handlers
from presentation.api.rest.v1.routers import api_v1_router

setup_logging()
logger = structlog.get_logger(__name__)


def get_cors_origins():
    """Allowed CORS origins. With credentials=True, browser requires explicit origins (not '*')."""
    default_dev_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    raw_origins = os.getenv("CORS_ORIGINS")
    if raw_origins:
        try:
            origins = json.loads(raw_origins)
            if origins and origins != ["*"]:
                return origins
        except json.JSONDecodeError:
            print("❌ Erro ao decodificar CORS_ORIGINS. Usando origens de desenvolvimento.")
    return default_dev_origins


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Asynchronous context manager for managing the lifespan of the FastAPI application.

    Args:
        app: The FastAPI application instance.

    Yields:
        None
    """
    logger.info("Starting application...")

    try:
        db_settings = DatabaseSettings()
        db_display = db_settings.database_display()
        msg = f"Database: {db_display}"
        print(f"\n  {msg}\n")
        logger.info(msg)
    except Exception as e:
        logger.warning(f"Could not resolve database display: {e}")
    
    try:
        logger.info("Validating AI configuration...")
        ai_config_valid = validate_ai_config()
        
        if not ai_config_valid:
            logger.warning("AI services not configured - running without AI features")
            llm = None
            embed_model = None
        else:
            logger.info("Initializing AI services...")
            llm, embed_model = setup_ai_services()
        
        app.state.llm = llm
        app.state.embed_model = embed_model
        
        logger.info("✅ AI services initialized successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize AI services: {e}")
        raise
    
    yield
    
    logger.info("Shutting down application...")


def create_app() -> FastAPI:
    """
    Creates and configures the FastAPI application.

    Returns:
        FastAPI: The configured FastAPI application instance.
    """
    app = FastAPI(
        title="HR System with AI", 
        version="1.0.0",
        description="Sistema de RH com análise de currículos por IA", 
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    origins = get_cors_origins()

    app.add_middleware(  
        CORSMiddleware,  
        allow_origins=origins, 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    container: AsyncContainer = make_async_container(*get_providers())
    setup_dishka(container, app)

    setup_exception_handlers(app)
    app.include_router(api_v1_router, prefix="/api/v1")
    
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint com informações do sistema de IA"""
        ai_info = {}
        
        if hasattr(app.state, "llm") and app.state.llm:
            ai_info = {
                "llm": app.state.llm.__class__.__name__,
                "llm_model": getattr(app.state.llm, "model", "N/A"),
                "embeddings": app.state.embed_model.__class__.__name__ if app.state.embed_model else "N/A",
                "embedding_model": getattr(app.state.embed_model, "model_name", "N/A") if app.state.embed_model else "N/A",
            }
        else:
            ai_info = {
                "status": "not_configured",
                "message": "AI services not configured - running without AI features"
            }
        
        return {
            "status": "healthy",
            "version": "1.0.0",
            "ai_services": ai_info
        }

    return app


app = create_app()


# Gradio interface for Hugging Face Spaces
if __name__ == "__main__":
    try:
        import gradio as gr
        
        def create_demo():
            with gr.Blocks(title="Adequa AI - Resume Analysis") as demo:
                gr.Markdown("# Adequa AI - Resume Analysis")
                gr.Markdown("**AI system applied to professional profile evaluation**")
                
                gr.Markdown("Esta é uma demonstração da plataforma Adequa AI.")
                gr.Markdown("Para acessar a aplicação completa, visite: https://adequa-ai-rag-resume-analyzer.vercel.app")
                
                with gr.Row():
                    with gr.Column():
                        gr.Markdown("""
                        ## Sobre o Adequa AI
                        
                        Adequa AI é uma plataforma inteligente que utiliza RAG (Retrieval-Augmented Generation) e modelos de linguagem avançados para automatizar a análise e triagem de currículos, conectando candidatos qualificados às vagas certas.
                        
                        ### Principais Funcionalidades
                        
                        **Para Recrutadores:**
                        - Upload em massa de currículos
                        - Busca inteligente por habilidades, experiência e localização
                        - Gestão de vagas com descrições detalhadas
                        - Análise automática de compatibilidade candidato-vaga em tempo real
                        - Índices reutilizáveis com vector stores salvos
                        
                        **Para Candidatos:**
                        - Análise de compatibilidade com vagas
                        - Dashboard personalizado com feedback da IA
                        - Recomendações de vagas compatíveis com o perfil
                        
                        ### Tecnologia
                        - **RAG com LlamaIndex**: indexação semântica de currículos
                        - **Groq API**: inferência ultra-rápida com modelos Llama
                        - **Autenticação JWT**: sistema seguro para candidatos e recrutadores
                        - **Vector Stores**: persistência de embeddings para consultas eficientes
                        """)
                
                gr.Markdown("---")
                gr.Markdown("Desenvolvido com ❤️ por Heloisa Cativo")
            
            return demo
        
        demo = create_demo()
        demo.launch()
        
    except ImportError:
        print("Gradio not available, running FastAPI server")
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=7860)
