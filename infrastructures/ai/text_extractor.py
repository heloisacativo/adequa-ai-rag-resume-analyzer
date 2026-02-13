"""Utilitários para extração de texto de arquivos"""

import io
from typing import Optional
import fitz  # PyMuPDF
from docx import Document

def extract_text_from_bytes(content: bytes, filename: str) -> Optional[str]:
    """Extrai texto de bytes baseado na extensão do arquivo"""
    ext = filename.lower().split('.')[-1]

    try:
        if ext == 'pdf':
            return _extract_pdf_text(content)
        elif ext in ['docx', 'doc']:
            return _extract_docx_text(content)
        elif ext == 'txt':
            return content.decode('utf-8', errors='ignore')
        else:
            return content.decode('utf-8', errors='ignore')
    except Exception:
        return None

def _extract_pdf_text(content: bytes) -> Optional[str]:
    """Extrai texto de PDF usando PyMuPDF"""
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception:
        return None

def _extract_docx_text(content: bytes) -> Optional[str]:
    """Extrai texto de DOCX usando python-docx"""
    try:
        doc = Document(io.BytesIO(content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception:
        return None