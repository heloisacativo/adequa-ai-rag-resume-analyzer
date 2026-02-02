from typing import Protocol, TYPE_CHECKING
from pathlib import Path

if TYPE_CHECKING:
    from llama_index.core import VectorStoreIndex

class IndexerProtocol(Protocol):
    async def index_documents(self, file_paths: list[Path]) -> str:
        """Returns vector_index_id"""
        ...
    
    async def search(self, index_id: str, query: str, top_k: int) -> list[dict]:
        """Returns list of relevant chunks with metadata"""
        ...
    
    async def load_index(self, index_id: str) -> "VectorStoreIndex":
        """Loads an existing index"""
        ...