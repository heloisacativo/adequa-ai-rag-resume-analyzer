from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.interfaces.ai.indexer import IndexerProtocol
from application.interfaces.ai.analyzer import AIAnalyzerProtocol
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol
from domain.entities.candidates.job_application import JobApplicationEntity


@dataclass
class StoredResumeAnalysisDTO:
    match_percentage: float
    missing_skills: list[str]
    strengths: list[str]
    overall_feedback: str
    resume_used: str  # nome do arquivo do currículo usado
    improvement_tips: list[str]


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class AnalyzeStoredResumeUseCase:
    job_repository: JobApplicationRepositoryProtocol
    resume_repository: ResumeRepositoryProtocol
    indexer: IndexerProtocol
    analyzer: AIAnalyzerProtocol

    async def __call__(self, job_id: int, user_id: str) -> StoredResumeAnalysisDTO:
        # 1. Buscar a aplicação de emprego
        job_application = await self.job_repository.get_by_id(job_id)
        if not job_application or job_application.user_id != user_id:
            raise ValueError("Candidatura não encontrada ou não autorizada")

        # 2. Buscar currículos indexados do usuário
        user_resumes = await self.resume_repository.get_by_user_id(UUID(user_id))
        indexed_resumes = [r for r in user_resumes if r.is_indexed and r.vector_index_id]

        if not indexed_resumes:
            raise ValueError("Nenhum currículo indexado encontrado para este usuário")

        # 3. Usar o currículo mais recente indexado
        resume = max(indexed_resumes, key=lambda r: r.uploaded_at)

        # 4. Fazer busca RAG usando a descrição da vaga como query
        query = f"Análise de compatibilidade para a vaga: {job_application.job_title}. {job_application.description}"
        search_results = await self.indexer.search(
            index_id=resume.vector_index_id,
            query=query,
            top_k=10  # Buscar os 10 chunks mais relevantes
        )

        # 5. Extrair o texto dos chunks encontrados
        resume_chunks = []
        for result in search_results:
            if 'text' in result:
                resume_chunks.append(result['text'])
            elif 'content' in result:
                resume_chunks.append(result['content'])

        if not resume_chunks:
            # Fallback: se não encontrou chunks relevantes, usar uma mensagem padrão
            resume_chunks = [f"Currículo de {resume.candidate_name} - arquivo: {resume.file_name}"]

        # 6. Analisar usando IA
        analysis_result = await self.analyzer.analyze_candidate(
            chunks=resume_chunks,
            job_description=job_application.description
        )

        # 7. Retornar resultado
        return StoredResumeAnalysisDTO(
            match_percentage=float(analysis_result.score),
            missing_skills=analysis_result.weaknesses,
            strengths=analysis_result.strengths,
            overall_feedback=analysis_result.justification,
            resume_used=resume.file_name,
            improvement_tips=getattr(analysis_result, 'improvement_tips', []) or []
        )