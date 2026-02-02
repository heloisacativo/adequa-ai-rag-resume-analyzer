from config.ai_config import setup_ai_services, validate_ai_config
import os
from dotenv import load_dotenv

load_dotenv()

# Validar
if validate_ai_config():
    print("✅ Configuração válida!")
    
    # Inicializar
    llm, embed_model = setup_ai_services()
    
    # Testar LLM
    response = llm.complete("Diga olá!")
    print(f"\n🤖 Resposta do LLM: {response}")
    
    # Testar Embedding
    embedding = embed_model.get_text_embedding("Teste de embedding")
    print(f"\n📊 Dimensão do embedding: {len(embedding)}")
else:
    print("❌ Configuração inválida!")