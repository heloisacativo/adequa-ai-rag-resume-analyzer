from dataclasses import dataclass
from datetime import datetime
from typing import final
from uuid import UUID

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ResumeDTO:
    resume_id: UUID
    candidate_name: str
    file_name: str
    file_path: str
    uploaded_at: datetime
    is_indexed: bool
    vector_index_id: str | None = None

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UploadResultDTO:
    total_files: int
    indexed_files: int
    vector_index_id: str
    resumes: list[ResumeDTO]