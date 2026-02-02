"""Document transformation for cleaning and enriching text"""

import re
from typing import final
from dataclasses import dataclass
from llama_index.core import Document

from application.interfaces.ai.transformer import TransformerProtocol

@final
@dataclass(frozen=True, slots=True)
class DocumentTransformer(TransformerProtocol):
    MAX_METADATA_LENGTH: int = 800
    
    def __call__(self, documents: list[Document]) -> list[Document]:
        """Transform documents with cleaning and metadata enrichment"""
        for doc in documents:
            cleaned_text = self._clean_text(doc.text)
            
            try:
                doc.text = cleaned_text
            except AttributeError:
                doc.metadata["cleaned_text"] = cleaned_text
            
            self._extract_skills(doc)
            self._extract_education(doc)
            self._extract_experience(doc)
            self._validate_metadata_length(doc)
        
        return documents
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'(\n\s*)+', '\n', text)
        return text.strip()
    
    def _extract_skills(self, doc: Document):
        """Extract skills from resume text"""
        skills_keywords = [
            "python", "java", "javascript", "sql", "react", "node",
            "docker", "kubernetes", "aws", "azure", "git", "agile"
        ]
        
        text_lower = doc.text.lower()
        found_skills = [skill for skill in skills_keywords if skill in text_lower]
        
        if found_skills:
            doc.metadata["skills"] = ", ".join(found_skills)
    
    def _extract_education(self, doc: Document):
        """Extract education information"""
        education_patterns = [
            r"(?i)(bachelor|master|phd|mba|degree)\s+(?:of|in|degree)?\s+([A-Za-z\s]+)",
            r"(?i)(university|college)\s+of\s+([A-Za-z\s]+)"
        ]
        
        for pattern in education_patterns:
            match = re.search(pattern, doc.text)
            if match:
                doc.metadata["education"] = match.group(0).strip()
                break
    
    def _extract_experience(self, doc: Document):
        """Extract years of experience"""
        exp_pattern = r"(\d+)\+?\s*years?\s+(?:of\s+)?experience"
        match = re.search(exp_pattern, doc.text, re.IGNORECASE)
        
        if match:
            doc.metadata["experience_years"] = int(match.group(1))
    
    def _validate_metadata_length(self, doc: Document):
        """Truncate metadata to limits"""
        for key, value in list(doc.metadata.items()):
            if isinstance(value, str) and len(value) > self.MAX_METADATA_LENGTH:
                doc.metadata[key] = value[:self.MAX_METADATA_LENGTH] + "..."


def create_transformation_pipeline() -> list[DocumentTransformer]:
    """Create transformation pipeline"""
    return [DocumentTransformer()]