"""Document ingestion for PDF, DOCX, JSON, CSV, and Markdown files"""

from pathlib import Path
from typing import final
from dataclasses import dataclass, field
from datetime import datetime
import json
import pandas as pd
from llama_index.core import SimpleDirectoryReader, Document
from llama_index.readers.file import DocxReader
# --- IMPORT NOVO ---
from llama_index.readers.file import PyMuPDFReader

from application.interfaces.ai.ingestor import IngestionProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class DocumentIngestor(IngestionProtocol):
    storage_dir: Path
    
    def ingest_all(self) -> list[Document]:
        """Load all supported file types from storage directory"""
        documents = []
        
        documents.extend(self._ingest_pdfs())
        documents.extend(self._ingest_docx())
        documents.extend(self._ingest_json())
        documents.extend(self._ingest_csv())
        documents.extend(self._ingest_markdown())
        
        # Add ingestion metadata
        for idx, doc in enumerate(documents):
            doc.metadata.update({
                "doc_id": f"doc_{idx:04d}",
                "ingestion_timestamp": datetime.now().isoformat()
            })
        
        return documents
    
    def ingest_files(self, file_paths: list[Path]) -> list[Document]:
        """Load specific files"""
        documents = []
        
        for file_path in file_paths:
            ext = file_path.suffix.lower()
            
            if ext == ".pdf":
                docs = self._load_pdf(file_path)
            elif ext == ".docx":
                docs = self._load_docx(file_path)
            elif ext == ".json":
                docs = self._load_json(file_path)
            elif ext == ".csv":
                docs = self._load_csv(file_path)
            elif ext == ".md":
                docs = self._load_markdown(file_path)
            elif ext in [".jpg", ".jpeg", ".png"]:
                docs = self._load_image_ocr(file_path)
            else:
                print(f"[WARNING] Formato não suportado: {ext} ({file_path})")
                continue
            
            documents.extend(docs)
        
        return documents
    
    def _ingest_pdfs(self) -> list[Document]:
        """Load PDF files (resumes)"""
        pdf_dir = self.storage_dir / "pdf"
        if not pdf_dir.exists():
            return []
        
        reader = SimpleDirectoryReader(
            input_dir=str(pdf_dir),
            required_exts=[".pdf"],
            recursive=False,
            file_extractor={".pdf": PyMuPDFReader()} 
        )
        
        docs = reader.load_data()
        for doc in docs:
            doc.metadata["file_type"] = "pdf"
            doc.metadata["source_dir"] = "pdf"
            self._extract_resume_metadata(doc)
        
        return docs
    
    
    def _ingest_docx(self) -> list[Document]:
        """Load DOCX files"""
        doc_dir = self.storage_dir / "doc"
        if not doc_dir.exists():
            return []
        
        documents = []
        docx_reader = DocxReader()
        
        for docx_file in doc_dir.glob("*.docx"):
            docs = docx_reader.load_data(file=docx_file)
            for doc in docs:
                doc.metadata["file_type"] = "docx"
                doc.metadata["source_dir"] = "doc"
                self._extract_resume_metadata(doc)
                documents.append(doc)
        
        return documents

    def _ingest_json(self) -> list[Document]:
        """Load JSON files"""
        json_dir = self.storage_dir / "json"
        if not json_dir.exists():
            return []
        
        documents = []
        for json_file in json_dir.glob("*.json"):
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                for item in data:
                    doc_text = json.dumps(item, indent=2)
                    doc = Document(
                        text=doc_text,
                        metadata={
                            "file_name": json_file.name,
                            "file_type": "json",
                            "source_dir": "json"
                        }
                    )
                    documents.append(doc)
            else:
                doc_text = json.dumps(data, indent=2)
                doc = Document(
                    text=doc_text,
                    metadata={
                        "file_name": json_file.name,
                        "file_type": "json",
                        "source_dir": "json"
                    }
                )
                documents.append(doc)
        
        return documents

    def _ingest_csv(self) -> list[Document]:
        """Load CSV files"""
        csv_dir = self.storage_dir / "csv"
        if not csv_dir.exists():
            return []
        
        documents = []
        for csv_file in csv_dir.glob("*.csv"):
            df = pd.read_csv(csv_file)
            
            for _, row in df.iterrows():
                doc_text = row.to_json(indent=2)
                doc = Document(
                    text=doc_text,
                    metadata={
                        "file_name": csv_file.name,
                        "file_type": "csv",
                        "source_dir": "csv"
                    }
                )
                documents.append(doc)
        
        return documents

    def _ingest_markdown(self) -> list[Document]:
        """Load markdown files"""
        md_files = list(self.storage_dir.rglob("*.md"))
        if not md_files:
            return []
        
        documents = []
        for md_file in md_files:
            reader = SimpleDirectoryReader(input_files=[str(md_file)])
            docs = reader.load_data()
            for doc in docs:
                doc.metadata["file_type"] = "markdown"
                doc.metadata["source_dir"] = str(md_file.parent.relative_to(self.storage_dir))
                documents.append(doc)
        
        return documents

    def _load_pdf(self, file_path: Path) -> list[Document]:
        reader = SimpleDirectoryReader(
            input_files=[str(file_path)],
            file_extractor={".pdf": PyMuPDFReader()}
        )
        docs = reader.load_data()
        for doc in docs:
            doc.metadata["file_type"] = "pdf"
            self._extract_resume_metadata(doc)
        return docs
    
    
    def _load_docx(self, file_path: Path) -> list[Document]:
        docx_reader = DocxReader()
        docs = docx_reader.load_data(file=file_path)
        for doc in docs:
            doc.metadata["file_type"] = "docx"
            self._extract_resume_metadata(doc)
        return docs
    
    def _load_json(self, file_path: Path) -> list[Document]:
        with open(file_path, 'r') as f:
            data = json.load(f)
        doc_text = json.dumps(data, indent=2)
        return [Document(
            text=doc_text,
            metadata={"file_name": file_path.name, "file_type": "json"}
        )]
    
    def _load_csv(self, file_path: Path) -> list[Document]:
        df = pd.read_csv(file_path)
        docs = []
        for _, row in df.iterrows():
            doc_text = row.to_json(indent=2)
            docs.append(Document(
                text=doc_text,
                metadata={"file_name": file_path.name, "file_type": "csv"}
            ))
        return docs
    
    def _load_markdown(self, file_path: Path) -> list[Document]:
        reader = SimpleDirectoryReader(input_files=[str(file_path)])
        docs = reader.load_data()
        for doc in docs:
            doc.metadata["file_type"] = "markdown"
        return docs
    
    def _load_image_ocr(self, file_path: Path) -> list[Document]:
        """Extract text from image using OCR (Tesseract)"""
        try:
            from PIL import Image
            import pytesseract
            
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img, lang='por')
            
            print(f"[DEBUG OCR] Texto extraído de {file_path.name}: {len(text)} caracteres")
            
            if not text.strip():
                print(f"[WARNING] Nenhum texto extraído de {file_path.name}")
                return []
            
            return [Document(
                text=text,
                metadata={
                    "file_name": file_path.name,
                    "file_type": "image",
                    "ocr": True
                }
            )]
        except ImportError:
            print("[ERROR] pytesseract ou PIL não instalado. Execute: pip install pytesseract pillow")
            return []
        except Exception as e:
            print(f"[ERROR] Falha no OCR para {file_path.name}: {str(e)}")
            return []
    
    def _extract_resume_metadata(self, doc: Document):
        """Extract candidate name from filename"""
        if "file_name" in doc.metadata:
            filename = Path(doc.metadata["file_name"]).stem
            doc.metadata["candidate_name"] = filename.replace("_", " ").title()