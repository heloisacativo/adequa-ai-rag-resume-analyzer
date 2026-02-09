from pathlib import Path
from typing import final, Optional
from dataclasses import dataclass
import asyncio
import shutil
import tempfile
import zipfile

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
    sqlite_storage: Optional[object] = None  # HTTPFileStorageService ou SQLiteFileStorageService
    
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
            
            temp_dir = Path(tempfile.mkdtemp(prefix=f"index_{index_id}_"))
            persist_dir = temp_dir / index_id
            persist_dir.mkdir(parents=True, exist_ok=True)
            
            index.storage_context.persist(persist_dir=str(persist_dir))
            print(f"[DEBUG INDEXER] Índice persistido temporariamente em: {persist_dir}")
            
            return index_id, temp_dir, persist_dir
        
        loop = asyncio.get_event_loop()
        index_id, temp_dir, persist_dir = await loop.run_in_executor(None, _index_sync)
        
        try:
            if self.sqlite_storage:
                print(f"📦 Compactando índice {index_id} para upload no PythonAnywhere...")
                
                # Cria ZIP do diretório do índice
                zip_path = temp_dir / f"{index_id}.zip"
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file in persist_dir.rglob('*'):
                        if file.is_file():
                            arcname = file.relative_to(persist_dir)
                            zipf.write(file, arcname)
                
                print(f"✅ Índice compactado: {zip_path} ({zip_path.stat().st_size} bytes)")
                
                zip_content = zip_path.read_bytes()
                sqlite_path = await self.sqlite_storage.upload_file(
                    filename=f"{index_id}.zip",
                    content=zip_content,
                    extension="zip"
                )
                print(f"✅ Índice enviado para PythonAnywhere: {sqlite_path}")
                
            else:
                final_persist_dir = self.vector_store_dir / index_id
                final_persist_dir.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(persist_dir), str(final_persist_dir))
                print(f"[DEBUG INDEXER] Índice movido para: {final_persist_dir}")
                
        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)
        
        return index_id
    
    async def search(self, index_id: str, query: str, top_k: int) -> list[dict]:
        def _search_sync(persist_dir: Path):
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
        
        persist_dir, temp_dir = await self._get_index_directory(index_id)
        
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, _search_sync, persist_dir)
        finally:
            if temp_dir and temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    async def load_index(self, index_id: str) -> VectorStoreIndex:
        """Carrega um índice existente."""
        def _load_sync(persist_dir: Path):
            storage_context = StorageContext.from_defaults(persist_dir=str(persist_dir))
            return load_index_from_storage(storage_context, embed_model=self.embed_model)
        
        persist_dir, temp_dir = await self._get_index_directory(index_id)
        
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, _load_sync, persist_dir)
        finally:
            # Limpa temp se foi criado
            if temp_dir and temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    async def _get_index_directory(self, index_id: str) -> tuple[Path, Optional[Path]]:
        """
        Retorna o diretório onde o índice está localizado.
        Se usar SQLite storage, baixa e descompacta em temp.
        Retorna: (persist_dir, temp_dir_opcional)
        """
        if self.sqlite_storage:
            print(f"📥 Baixando índice {index_id} do PythonAnywhere...")
            
            try:
                try:
                    zip_content = await self.sqlite_storage.download_file(f"zip/{index_id}.zip")
                    print(f"✅ Índice baixado: {len(zip_content)} bytes")
                except FileNotFoundError:
                    zip_content = await self.sqlite_storage.download_file(f"{index_id}.zip")
                    print(f"✅ Índice baixado: {len(zip_content)} bytes")
                
                temp_dir = Path(tempfile.mkdtemp(prefix=f"index_{index_id}_"))
                zip_path = temp_dir / f"{index_id}.zip"
                zip_path.write_bytes(zip_content)
                
                persist_dir = temp_dir / index_id
                persist_dir.mkdir(parents=True, exist_ok=True)
                
                with zipfile.ZipFile(zip_path, 'r') as zipf:
                    zipf.extractall(persist_dir)
                
                print(f"✅ Índice descompactado em: {persist_dir}")
                return persist_dir, temp_dir
                
            except FileNotFoundError:
                print(f"⚠️  Índice não encontrado no PythonAnywhere, tentando busca local...")
                persist_dir = self.vector_store_dir / index_id
                
                if persist_dir.exists():
                    print(f"✅ Índice encontrado localmente em: {persist_dir}")
                    return persist_dir, None
                else:
                    available_indexes = [d.name for d in self.vector_store_dir.iterdir() if d.is_dir()] if self.vector_store_dir.exists() else []
                    error_msg = f"Índice {index_id} não encontrado no PythonAnywhere nem localmente."
                    if available_indexes:
                        error_msg += f" Índices locais disponíveis: {', '.join(available_indexes)}"
                    else:
                        error_msg += " Nenhum índice encontrado. Faça upload de currículos primeiro."
                    raise FileNotFoundError(error_msg)
            
        else:
            persist_dir = self.vector_store_dir / index_id
            
            if not persist_dir.exists():
                available_indexes = [d.name for d in self.vector_store_dir.iterdir() if d.is_dir()] if self.vector_store_dir.exists() else []
                error_msg = f"Índice {index_id} não encontrado em {persist_dir}."
                if available_indexes:
                    error_msg += f" Índices disponíveis: {', '.join(available_indexes)}"
                else:
                    error_msg += " Nenhum índice encontrado. Faça upload de currículos primeiro."
                raise FileNotFoundError(error_msg)
            
            return persist_dir, None