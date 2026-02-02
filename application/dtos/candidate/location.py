"""DTOs para análise de localização geográfica."""
from pydantic import BaseModel, Field
from typing import Optional, Literal


class LocationAnalysis(BaseModel):
    """Schema para análise de compatibilidade geográfica entre vaga e candidato."""

    has_location_requirement: bool = Field(
        False,
        description="Se a vaga tem requisito de localização específica."
    )

    job_location: Optional[str] = Field(
        None,
        description="Localização da vaga se especificada."
    )

    candidate_location: Optional[str] = Field(
        None,
        description="Cidade e Estado onde o candidato reside, extraído do currículo."
    )

    is_location_match: bool = Field(
        True,
        description="Se a localização do candidato é compatível com a vaga."
    )

    willing_to_relocate: bool = Field(
        False,
        description="Se o candidato demonstra disposição para mudança/relocação."
    )

    match_status: str = Field(
        "REMOTE",
        description="Status do match: REMOTE, LOCATION_MATCH, WILL_RELOCATE, DIFFERENT_LOCATIONS, NO_SPECIFIC_LOCATION, CANDIDATE_LOCATION_UNKNOWN"
    )
