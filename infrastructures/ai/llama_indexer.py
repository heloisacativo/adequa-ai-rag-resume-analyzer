from pathlib import Path
from typing import final
from dataclasses import dataclass
import asyncio

from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.core.embeddings import BaseEmbedding

from application.interfaces.ai.indexer import IndexerProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class LlamaIndexer(IndexerProtocol):
    embed_model: BaseEmbedding
    vector_store_dir: Path
    chunker: "ChunkerProtocol"
    ingestor: "IngestionProtocol"
    
    async def index_documents(self, file_paths: list[Path]) -> str:
        def _index_sync():
            print(f"[DEBUG INDEXER] Recebido {len(file_paths)} arquivos para indexar")
            print(f"[DEBUG INDEXER] Arquivos: {[str(p) for p in file_paths]}")
            
            # 1. Ingere documentos
            documents = self.ingestor.ingest_files(file_paths)
            print(f"[DEBUG INDEXER] Total de documentos após ingestão: {len(documents)}")
            
            # 2. Faz chunking
            chunks = self.chunker.chunk_documents(documents)
            print(f"[DEBUG INDEXER] Total de chunks/nodes criados: {len(chunks)}")
            
            if len(chunks) > 0:
                print(f"[DEBUG INDEXER] Exemplo de metadata do primeiro chunk: {chunks[0].metadata if hasattr(chunks[0], 'metadata') else 'sem metadata'}")
            
            # 3. Cria índice com nodes
            index = VectorStoreIndex(
                nodes=chunks,
                embed_model=self.embed_model
            )
            print(f"[DEBUG INDEXER] Índice criado com sucesso")
            
            # 4. Persiste
            from datetime import datetime
            index_id = datetime.now().strftime("%Y%m%d%H%M%S")
            persist_dir = self.vector_store_dir / index_id
            persist_dir.mkdir(parents=True, exist_ok=True)
            index.storage_context.persist(persist_dir=str(persist_dir))
            print(f"[DEBUG INDEXER] Índice persistido em: {persist_dir}")
            
            return index_id
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _index_sync)
    
    async def search(self, index_id: str, query: str, top_k: int) -> list[dict]:
        def _search_sync():
            persist_dir = self.vector_store_dir / index_id
            storage_context = StorageContext.from_defaults(persist_dir=str(persist_dir))
            index = load_index_from_storage(storage_context, embed_model=self.embed_model)
            
            retriever = index.as_retriever(similarity_top_k=top_k)
            nodes = retriever.retrieve(query)
            
            return [
                {
                    "text": node.text,
                    "metadata": node.metadata,
                    "score": node.score
                }
                for node in nodes
            ]
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _search_sync)
    
    async def load_index(self, index_id: str) -> VectorStoreIndex:
        """Carrega um índice existente."""
        def _load_sync():
            persist_dir = self.vector_store_dir / index_id
            if not persist_dir.exists():
                raise FileNotFoundError(f"Índice {index_id} não encontrado em {persist_dir}")
            
            storage_context = StorageContext.from_defaults(persist_dir=str(persist_dir))
            return load_index_from_storage(storage_context, embed_model=self.embed_model)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _load_sync)