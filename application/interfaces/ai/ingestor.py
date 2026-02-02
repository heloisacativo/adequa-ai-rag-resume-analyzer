from typing import Protocol
from pathlib import Path
from llama_index.core import Document

class IngestionProtocol(Protocol):
    def ingest_all(self) -> list[Document]:
        """Load and process all files from storage"""
        ...
    
    def ingest_files(self, file_paths: list[Path]) -> list[Document]:
        """Load specific files"""
        ...