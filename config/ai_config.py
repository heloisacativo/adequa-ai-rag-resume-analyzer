import os
from typing import Tuple
from llama_index.core import Settings

try:
    from llama_index.embeddings.huggingface_api import HuggingFaceInferenceAPIEmbedding
except ImportError:
    HuggingFaceInferenceAPIEmbedding = None

try:
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding
except ImportError:
    HuggingFaceEmbedding = None

try:
    from llama_index.llms.groq import Groq
except ImportError:
    Groq = None

try:
    from llama_index.llms.ollama import Ollama
    from llama_index.embeddings.ollama import OllamaEmbedding
except ImportError:
    Ollama = None
    OllamaEmbedding = None


def setup_ai_services():
    """
    Configura LLM e Embeddings baseado nas variáveis de ambiente.
    Suporta Groq + HuggingFace (local ou API) OU Ollama.
    USE_HF_EMBEDDING_API=true + HUGGINGFACE_TOKEN = embeddings via API (leve, sem PyTorch).
    """
    
    use_groq = os.getenv("USE_GROQ", "true").lower() == "true"
    use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"
    use_hf_api = os.getenv("USE_HF_EMBEDDING_API", "false").lower() == "true"
    hf_token = (
        os.getenv("HUGGINGFACE_TOKEN")
        or os.getenv("HF_TOKEN")
        or os.getenv("HUGGINGFACE_API_KEY")
    )
    
    # config llm
    if use_groq and Groq:
        print("🚀 Configurando Groq LLM...")
        llm = Groq(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0,  # Respostas determinísticas
        )
    elif use_ollama and Ollama:
        print("🤖 Configurando Ollama LLM...")
        llm = Ollama(
            model=os.getenv("OLLAMA_MODEL", "qwen3:0.6b"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            request_timeout=float(os.getenv("LLM_TIMEOUT", 120))
        )
    else:
        raise ValueError(
            "Nenhum LLM configurado! "
            "Configure USE_GROQ=true ou USE_OLLAMA=true no .env"
        )
    
    # config embeddings
    if use_ollama and OllamaEmbedding:
        print("🤖 Configurando Ollama Embeddings...")
        embed_model = OllamaEmbedding(
            model_name=os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
    elif (use_hf_api or hf_token) and HuggingFaceInferenceAPIEmbedding and hf_token:
        print("🤗 Configurando HuggingFace Embeddings (API – modo leve)...")
        embed_model = HuggingFaceInferenceAPIEmbedding(
            model_name=os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"),
            token=hf_token,
        )
    elif HuggingFaceEmbedding:
        print("🤗 Configurando HuggingFace Embeddings (local)...")
        embed_model = HuggingFaceEmbedding(
            model_name=os.getenv(
                "EMBEDDING_MODEL",
                "sentence-transformers/all-MiniLM-L6-v2"
            ),
            cache_folder="./models_cache"
        )
    else:
        raise ValueError(
            "Nenhum embedding configurado. Opções: "
            "1) HUGGINGFACE_TOKEN no .env (modo leve; pip install llama-index-embeddings-huggingface-api) "
            "2) pip install llama-index-embeddings-huggingface sentence-transformers (modo local)"
        )
    
    # config globalmente no llamaindex
    Settings.llm = llm
    Settings.embed_model = embed_model
    Settings.chunk_size = int(os.getenv("CHUNK_SIZE_TOKENS", 512))
    Settings.chunk_overlap = int(os.getenv("CHUNK_OVERLAP_TOKENS", 50))
    
    print("✅ Serviços de IA configurados com sucesso!")
    print(f"   - LLM: {llm.__class__.__name__}")
    print(f"   - Embeddings: {embed_model.__class__.__name__}")
    
    return llm, embed_model


# validate ai config
def validate_ai_config() -> bool:
    """Valida se as configurações de IA estão corretas"""
    use_groq = os.getenv("USE_GROQ", "").lower() == "true"
    use_ollama = os.getenv("USE_OLLAMA", "").lower() == "true"
    use_hf_api = os.getenv("USE_HF_EMBEDDING_API", "").lower() == "true"
    
    if use_groq:
        if not os.getenv("GROQ_API_KEY"):
            print("❌ ERRO: USE_GROQ=true mas GROQ_API_KEY não configurada!")
            return False
    
    if use_hf_api and not (
        os.getenv("HUGGINGFACE_TOKEN")
        or os.getenv("HF_TOKEN")
        or os.getenv("HUGGINGFACE_API_KEY")
    ):
        print("❌ ERRO: USE_HF_EMBEDDING_API=true mas HUGGINGFACE_TOKEN/HUGGINGFACE_API_KEY não configurado!")
        return False
    
    if use_ollama:
        # test connection with ollama (optional)
        pass
    
    if not use_groq and not use_ollama:
        print("⚠️ AVISO: Nenhum LLM configurado!")
        return False
    
    return True