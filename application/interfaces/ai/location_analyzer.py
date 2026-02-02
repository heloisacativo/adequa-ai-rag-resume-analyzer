"""Interface para análise de localização geográfica."""
from typing import Protocol
from application.dtos.candidate.location import LocationAnalysis


class LocationAnalyzerProtocol(Protocol):
    """Protocolo para análise de compatibilidade geográfica."""
    
    async def analyze_location(
        self,
        job_description: str,
        resume_text: str
    ) -> LocationAnalysis:
        """
        Analisa a compatibilidade geográfica entre vaga e candidato.
        
        Args:
            job_description: Descrição completa da vaga
            resume_text: Texto completo do currículo do candidato
            
        Returns:
            LocationAnalysis com informações sobre compatibilidade geográfica
        """
        ...
