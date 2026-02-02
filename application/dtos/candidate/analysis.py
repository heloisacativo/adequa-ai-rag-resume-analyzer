"""DTOs para análise de candidatos."""
from dataclasses import dataclass
from typing import Optional

from application.dtos.candidate.location import LocationAnalysis


@dataclass(frozen=True, slots=True)
class CandidateResultDTO:
    """Resultado da análise de um candidato."""
    arquivo: str
    nome_candidato: str
    score: int
    pontos_fortes: list[str]
    pontos_fracos: list[str]
    justificativa: str
    location_analysis: Optional[LocationAnalysis] = None


@dataclass(frozen=True, slots=True)
class SearchResponseDTO:
    """Resposta da busca/análise."""
    query: str
    response: str
    total_candidates: int
    ranking: list[CandidateResultDTO]
