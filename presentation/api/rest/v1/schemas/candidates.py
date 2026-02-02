"""Schemas para candidatos."""
from pydantic import BaseModel, Field
from typing import Optional

from application.dtos.candidate.location import LocationAnalysis


class CandidateResultSchema(BaseModel):
    """Schema de resultado de análise de candidato."""
    arquivo: str
    nome_candidato: str
    score: int = Field(ge=0, le=100)
    pontos_fortes: list[str]
    pontos_fracos: list[str]
    justificativa: str
    location_analysis: Optional[LocationAnalysis] = None


class SearchResponseSchema(BaseModel):
    """Schema de resposta de busca/análise."""
    query: str
    response: str
    total_candidates: int
    ranking: list[CandidateResultSchema]


class AnalysisResponse(BaseModel):
    """Schema de resposta de análise de candidatos."""
    query: str
    total_candidates: int
    best_candidate: Optional[CandidateResultSchema] = None
    ranking: list[CandidateResultSchema]
