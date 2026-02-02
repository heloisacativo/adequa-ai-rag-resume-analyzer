from dataclasses import dataclass
from pathlib import Path
from typing import final, Optional
from uuid import UUID, uuid4

from application.dtos.resumes.resume import UploadResultDTO, ResumeDTO
from application.interfaces.ai.indexer import IndexerProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol
from domain.entities.resumes.resume import ResumeEntity

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UploadResumesUseCase:
    uow: UnitOfWorkProtocol
    repository: ResumeRepositoryProtocol
    indexer: IndexerProtocol
    storage_dir: Path
    s3_storage: Optional[object] = None  # S3StorageService
    
    async def execute(
        self, 
        files: list[tuple[str, bytes]], 
        user_id: UUID
    ) -> UploadResultDTO:
        """
        1. Salva arquivos no storage
        2. Indexa no vector store
        3. Persiste metadados no DB
        """
        # Verificar limite de 40 currículos por usuário
        existing_resumes_count = await self.repository.count_by_user_id(user_id)
        if existing_resumes_count >= 40:
            from application.exceptions import BusinessRuleViolationError
            raise BusinessRuleViolationError("Limite máximo de 40 currículos por usuário atingido")
        
        saved_paths = []
        
        # 1. Salva arquivos
        for filename, content in files:
            file_path = self._save_file(filename, content)
            saved_paths.append(file_path)
        
        # 2. Indexa documentos
        vector_index_id = await self.indexer.index_documents(saved_paths)
        
        # 3. Cria entidades e persiste
        resume_entities = []
        for path in saved_paths:
            entity = ResumeEntity(
                resume_id=uuid4(),
                candidate_name=self._extract_name(path),
                file_name=path.name,
                file_path=str(path),
                uploaded_by_user_id=user_id,
                vector_index_id=vector_index_id,
                is_indexed=True
            )
            resume_entities.append(entity)
        
        async with self.uow:
            for entity in resume_entities:
                await self.repository.add(entity)
        
        # 4. Retorna DTO
        resume_dtos = [
            ResumeDTO(
                resume_id=e.resume_id,
                candidate_name=e.candidate_name,
                file_name=e.file_name,
                file_path=e.file_path,
                uploaded_at=e.uploaded_at,
                is_indexed=e.is_indexed
            )
            for e in resume_entities
        ]
        
        return UploadResultDTO(
            total_files=len(files),
            indexed_files=len(resume_dtos),
            vector_index_id=vector_index_id,
            resumes=resume_dtos
        )
    
    def _save_file(self, filename: str, content: bytes) -> Path:
        """Salva arquivo usando S3 se disponível, senão usa armazenamento local"""
        ext = Path(filename).suffix.lower()
        
        if self.s3_storage:
            # Upload para S3/DigitalOcean Spaces
            s3_key = self.s3_storage.upload_file(filename, content, ext)
            # Retorna um Path "virtual" com a chave S3
            return Path(f"s3://{s3_key}")
        else:
            # Armazenamento local (fallback)
            subdir = self.storage_dir / ext.replace('.', '')
            subdir.mkdir(parents=True, exist_ok=True)
            file_path = subdir / filename
            file_path.write_bytes(content)
            return file_path
    
    def _extract_name(self, path: Path) -> str:
        # Implementar extração de nome do PDF/DOCX
        return path.stem