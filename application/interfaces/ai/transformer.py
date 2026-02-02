from typing import Protocol
from llama_index.core import Document

class TransformerProtocol(Protocol):
    def __call__(self, documents: list[Document]) -> list[Document]:
        """Transform and enrich documents"""
        ...