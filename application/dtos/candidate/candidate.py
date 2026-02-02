from dataclasses import dataclass, field
from typing import final, Optional
from uuid import UUID

from application.dtos.candidate.location import LocationAnalysis

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CandidateAnalysisDTO:
    resume_id: UUID
    candidate_name: str
    file_name: str
    score: int
    strengths: list[str]
    weaknesses: list[str]
    justification: str
    location_analysis: Optional[LocationAnalysis] = None
    improvement_tips: list[str] = field(default_factory=list)

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class RankingResultDTO:
    query: str
    total_candidates: int
    best_candidate: CandidateAnalysisDTO | None
    ranking: list[CandidateAnalysisDTO]