from typing import Protocol
from application.dtos.candidate.candidate import CandidateAnalysisDTO  # ✅ candidate (sem 's')

class AIAnalyzerProtocol(Protocol):
    async def analyze_candidate(
        self, 
        chunks: list[str], 
        job_description: str
    ) -> CandidateAnalysisDTO:
        """Analyze candidate resume against job description"""
        ...