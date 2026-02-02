from typing import Protocol
from llama_index.core import Document

class ChunkerProtocol(Protocol):
    def chunk_documents(self, documents: list[Document]) -> list[Document]:
        """Split documents into chunks"""
        ...