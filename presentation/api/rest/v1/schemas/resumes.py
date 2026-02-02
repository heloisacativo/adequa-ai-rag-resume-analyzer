from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ResumeSchema(BaseModel):
    resume_id: str
    candidate_name: str
    file_name: str
    uploaded_at: str
    is_indexed: bool

class UploadResponse(BaseModel):
    message: str
    total_files: int
    indexed_files: int
    vector_index_id: str
    resumes: list[ResumeSchema]

class IndexInfoResponse(BaseModel):
    """Informações de um índice vetorial."""
    vector_index_id: str
    resume_count: int
    first_uploaded_at: str
    resumes: list[ResumeSchema]

class ListIndexesResponse(BaseModel):
    """Resposta com lista de índices."""
    indexes: dict[str, IndexInfoResponse]

class ListResumesResponse(BaseModel):
    """Resposta com lista de currículos."""
    resumes: list[ResumeSchema]
    total: int