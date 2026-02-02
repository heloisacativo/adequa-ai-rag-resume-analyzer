from pydantic import Field, ConfigDict
from pydantic_settings import BaseSettings

class AISettings(BaseSettings):
    # ⭐ NOVO: Groq LLM Settings
    use_groq: bool = Field(default=True)
    groq_api_key: str = Field(default="")
    groq_model: str = Field(default="llama-3.3-70b-versatile")
    
    # ⭐ NOVO: HuggingFace Embeddings
    huggingface_api_key: str = Field(default="")
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    embedding_dimension: int = Field(default=384)  # all-MiniLM-L6-v2 = 384 dimensões
    
    # ANTIGO: Ollama Settings (manter para compatibilidade)
    use_ollama: bool = Field(default=False)
    ollama_model: str = Field(default="qwen3:0.6b")
    ollama_embed_model: str = Field(default="nomic-embed-text")
    
    # Storage Settings
    use_s3_storage: bool = Field(default=False)
    s3_endpoint_url: str = Field(default="")  # DigitalOcean Spaces endpoint
    s3_region: str = Field(default="nyc3")  # DigitalOcean region
    s3_access_key: str = Field(default="")
    s3_secret_key: str = Field(default="")
    s3_bucket_name: str = Field(default="")
    s3_folder_prefix: str = Field(default="uploaded_files")  # pasta dentro do bucket
    
    # SQLite Storage Settings (para usar com PythonAnywhere)
    use_sqlite_storage: bool = Field(default=False)
    sqlite_storage_url: str = Field(default="")  # URL do SQLite no PythonAnywhere
    
    vector_store_dir: str = Field(default="./vector_stores/resumes")
    storage_dir: str = Field(default="./uploaded_files")  # fallback local
    vector_store_type: str = Field(default="faiss")
    
    # Processing Settings
    similarity_top_k: int = Field(default=50)
    llm_timeout: int = Field(default=120)
    chunk_size_tokens: int = Field(default=512)
    chunk_overlap_tokens: int = Field(default=50)
    use_semantic_chunking: bool = Field(default=True)
    max_batch_size: int = Field(default=10)
    
    # Collections
    astra_db_collection_resumes: str = Field(default="resumes")
    astra_db_collection_candidates: str = Field(default="candidates")
    
    # Tracing
    enable_ai_tracing: bool = Field(default=False)
    langfuse_secret_key: str = Field(default="")
    langfuse_public_key: str = Field(default="")
    langfuse_host: str = Field(default="https://cloud.langfuse.com")
    
    model_config = ConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        extra="ignore"
    )