from dataclasses import dataclass
from typing import final
from uuid import UUID

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CandidateAnalysisEntity:
    resume_id: UUID
    candidate_name: str
    score: int  # 0-100
    strengths: list[str]
    weaknesses: list[str]
    justification: str
    
    def __post_init__(self):
        if not 0 <= self.score <= 100:
            raise ValueError("Score must be between 0 and 100")