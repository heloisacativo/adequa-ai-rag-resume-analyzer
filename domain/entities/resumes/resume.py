from dataclasses import dataclass, field
from datetime import datetime, UTC
from typing import final
from uuid import UUID

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ResumeEntity:
    resume_id: UUID
    candidate_name: str
    file_name: str
    file_path: str
    uploaded_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    uploaded_by_user_id: UUID
    vector_index_id: str | None = None
    is_indexed: bool = False