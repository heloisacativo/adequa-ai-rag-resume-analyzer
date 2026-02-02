"""Intelligent chunking for resume documents"""

import re
from typing import final, Any
from dataclasses import dataclass
from llama_index.core import Document
from llama_index.core.node_parser import (
    SemanticSplitterNodeParser,
    SentenceSplitter
)

from application.interfaces.ai.chunker import ChunkerProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class SmartChunker(ChunkerProtocol):
    chunk_size: int = 512
    chunk_overlap: int = 50
    use_semantic: bool = True
    embed_model: Any = None  # Aceita qualquer embedding
    
    def __post_init__(self):
        if self.use_semantic and not self.embed_model:
            raise ValueError("embed_model required when use_semantic=True")
    
    def chunk_documents(self, documents: list[Document]) -> list[Document]:
        """Split documents into chunks using semantic or sentence splitting"""
        
        if self.use_semantic:
            splitter = SemanticSplitterNodeParser(
                embed_model=self.embed_model,
                buffer_size=1,
                breakpoint_percentile_threshold=95,
                include_metadata=True,
                include_prev_next_rel=True
            )
        else:
            splitter = SentenceSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
        
        nodes = []
        for original_doc in documents:
            # Trabalhamos com uma variável local 'doc'
            doc = original_doc

            # --- LIMPEZA DE EMOJIS ---
            # Se tiver texto, limpamos e criamos uma NOVA instância para evitar AttributeError
            if doc.text:
                clean_text = self._remove_emojis(doc.text)
                # Recriamos o objeto Documento para garantir que não estamos infringindo imutabilidade
                doc = Document(
                    text=clean_text,
                    metadata=original_doc.metadata or {}
                )
            
            # Resume-specific chunking
            if self._is_resume_doc(doc):
                chunked = self._chunk_by_sections(doc, splitter)
            else:
                chunked = splitter.get_nodes_from_documents([doc])
            
            for chunk in chunked:
                # Garante que metadados persistam nos chunks
                chunk.metadata.update(doc.metadata)
            
            nodes.extend(chunked)
        
        return nodes
    
    def _remove_emojis(self, text: str) -> str:
        """
        Remove emojis e símbolos pictográficos comuns usando Regex.
        Mantém acentos e pontuação padrão.
        """
        emoji_pattern = re.compile(
            "["
            "\U0001f600-\U0001f64f"  # Emoticons
            "\U0001f300-\U0001f5ff"  # Symbols & Pictographs
            "\U0001f680-\U0001f6ff"  # Transport & Map Symbols
            "\U0001f1e0-\U0001f1ff"  # Flags
            "\u2700-\u27bf"          # Dingbats
            "\u2600-\u26ff"          # Miscellaneous Symbols
            "\U0001f900-\U0001f9ff"  # Supplemental Symbols
            "\uFE0F"                 # Variation Selectors
            "]+", flags=re.UNICODE
        )
        return emoji_pattern.sub("", text)

    def _is_resume_doc(self, doc: Document) -> bool:
        """Check if document is a resume"""
        # Verificação segura de metadados
        meta = doc.metadata or {}
        return meta.get("file_type") == "pdf" or "resume" in meta
    
    def _chunk_by_sections(self, doc: Document, splitter) -> list[Document]:
        """Chunk resume by sections (Education, Experience, Skills)"""
        text = doc.text
        
        section_keywords = [
            "EDUCATION", "EXPERIENCE", "SKILLS", "WORK HISTORY",
            "PROFESSIONAL SUMMARY", "CERTIFICATIONS", "PROJECTS"
        ]
        
        sections = self._split_by_sections(text, section_keywords)
        
        chunks = []
        for section_name, section_text in sections:
            if len(section_text) > self.chunk_size * 4:
                section_chunks = splitter.get_nodes_from_documents([
                    Document(text=section_text)
                ])
                for chunk in section_chunks:
                    chunk.metadata.update({
                        **doc.metadata,
                        "section": section_name,
                        "chunk_type": "section_part"
                    })
                    chunks.append(chunk)
            else:
                chunk = Document(
                    text=section_text,
                    metadata={
                        **doc.metadata,
                        "section": section_name,
                        "chunk_type": "section_complete"
                    }
                )
                chunks.append(chunk)
        
        return chunks if chunks else splitter.get_nodes_from_documents([doc])
    
    def _split_by_sections(self, text: str, keywords: list[str]) -> list[tuple[str, str]]:
        """Split text by section headers"""
        sections = []
        current_section = "GENERAL"
        current_text = []
        
        lines = text.split('\n')
        for line in lines:
            found_section = False
            for keyword in keywords:
                if keyword in line.upper() and len(line) < 50:
                    if current_text:
                        sections.append((current_section, '\n'.join(current_text)))
                    current_section = keyword
                    current_text = [line]
                    found_section = True
                    break
            
            if not found_section:
                current_text.append(line)
        
        if current_text:
            sections.append((current_section, '\n'.join(current_text)))
        
        return sections if sections else [("GENERAL", text)]


def create_chunking_pipeline(
    use_semantic: bool = True,
    embed_model: Any = None
) -> SmartChunker:
    """Factory function to create chunker"""
    return SmartChunker(
        use_semantic=use_semantic,
        embed_model=embed_model
    )