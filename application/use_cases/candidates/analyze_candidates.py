from dataclasses import dataclass
from typing import final

from application.dtos.candidate.candidate import RankingResultDTO, CandidateAnalysisDTO
from application.interfaces.ai.indexer import IndexerProtocol
from application.interfaces.ai.analyzer import AIAnalyzerProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class AnalyzeCandidatesUseCase:
    indexer: IndexerProtocol
    analyzer: AIAnalyzerProtocol
    resume_repository: ResumeRepositoryProtocol
    
    async def execute(self, job_description: str, index_id: str) -> RankingResultDTO:
        """
        1. Busca chunks relevantes no vector store
        2. Agrupa por candidato
        3. Analisa cada candidato com LLM
        4. Rankeia por score
        """
        resumes_in_index = await self.resume_repository.get_by_vector_index_id(index_id)
        if len(resumes_in_index) < 2:
            from application.exceptions import BusinessRuleViolationError
            raise BusinessRuleViolationError(
                f"É necessário ter pelo menos 2 currículos indexados para realizar análises. "
                f"Atualmente há {len(resumes_in_index)} currículo(s) neste índice."
            )
        
        chunks = await self.indexer.search(index_id, job_description, top_k=50)
        
        candidates_map = self._group_by_candidate(chunks)
        
        analyses = []
        for file_name, candidate_chunks in candidates_map.items():
            analysis = await self.analyzer.analyze_candidate(
                chunks=candidate_chunks,
                job_description=job_description
            )
            analyses.append(analysis)
        
        ranked = sorted(analyses, key=lambda x: x.score, reverse=True)
        
        return RankingResultDTO(
            query=job_description,
            total_candidates=len(ranked),
            best_candidate=ranked[0] if ranked else None,
            ranking=ranked
        )
    
    def _group_by_candidate(self, chunks: list[dict]) -> dict[str, list[str]]:
        result = {}
        for chunk in chunks:
            file_name = chunk.get("metadata", {}).get("file_name", "Unknown")
            if file_name not in result:
                result[file_name] = []
            result[file_name].append(chunk["text"])
        return result