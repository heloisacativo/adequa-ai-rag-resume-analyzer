from dataclasses import dataclass
from typing import final
from pathlib import Path
from fastapi import UploadFile
import tempfile
import os

from application.interfaces.ai.chunker import ChunkerProtocol
from application.interfaces.ai.ingestor import IngestionProtocol
from application.interfaces.ai.analyzer import AIAnalyzerProtocol
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from domain.entities.candidates.job_application import JobApplicationEntity


@dataclass
class ResumeAnalysisDTO:
    match_percentage: float
    missing_skills: list[str]
    strengths: list[str]
    overall_feedback: str
    improvement_tips: list[str]


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class AnalyzeResumeUseCase:
    repository: JobApplicationRepositoryProtocol
    ingestor: IngestionProtocol
    chunker: ChunkerProtocol
    analyzer: AIAnalyzerProtocol

    async def __call__(self, job_id: int, user_id: str, resume_file: UploadFile) -> ResumeAnalysisDTO:
        # Buscar a candidatura para obter a descrição da vaga
        job_application = await self.repository.get_by_id(job_id)
        if not job_application or job_application.user_id != user_id:
            raise ValueError("Candidatura não encontrada ou não autorizada")

        # Salvar o arquivo temporariamente
        temp_dir = "/tmp/resume_debug"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = f"{temp_dir}/resume_{job_id}_{user_id}_{resume_file.filename}"
        
        with open(temp_file_path, 'wb') as temp_file:
            content = await resume_file.read()
            temp_file.write(content)
            print(f"DEBUG: Saved file to: {temp_file_path}")
            print(f"DEBUG: File size: {len(content)} bytes")

        try:
            # Processar o currículo
            file_path = Path(temp_file_path)
            print(f"DEBUG: Processing file: {file_path}")
            
            # Tentar ler como texto primeiro (para arquivos .txt)
            resume_text = ""
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        resume_text = f.read()
                    print(f"DEBUG: Read as text file, length: {len(resume_text)}")
                    print(f"DEBUG: Text preview: {resume_text[:500]}")
                except UnicodeDecodeError:
                    print("DEBUG: File is binary, using LlamaIndex")
                    documents = self.ingestor.ingest_files([file_path])
                    if documents:
                        resume_text = documents[0].text
                        print(f"DEBUG: Extracted text length: {len(resume_text)}")
                        print(f"DEBUG: Extracted text preview: {resume_text[:500]}")
            
            if not resume_text.strip():
                print("DEBUG: No text content found in resume!")
                resume_text = "Conteúdo do currículo não pôde ser extraído."
            
            resume_chunks = [resume_text]

            # Analisar usando IA
            analysis_result = await self.analyzer.analyze_candidate(
                chunks=resume_chunks,
                job_description=job_application.description
            )

            # Converter para o formato esperado
            return ResumeAnalysisDTO(
                match_percentage=float(analysis_result.score),  # Já é 0-100
                missing_skills=analysis_result.weaknesses,
                strengths=analysis_result.strengths,
                overall_feedback=analysis_result.justification,
                improvement_tips=getattr(analysis_result, 'improvement_tips', []) or []
            )

        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)