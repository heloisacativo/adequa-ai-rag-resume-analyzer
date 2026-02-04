"""Use case para listar todos os currículos."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.dtos.resumes.resume import ResumeDTO
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ListResumesUseCase:
    """Use case para listar todos os currículos."""
    
    repository: ResumeRepositoryProtocol
    
    async def execute(self, user_id: UUID | None = None) -> list[ResumeDTO]:
        """
        Lista todos os currículos.
        
        Args:
            user_id: Se fornecido, filtra apenas currículos do usuário
        
        Returns:
            Lista de DTOs de currículos
        """
        if user_id:
            resumes = await self.repository.get_by_user_id(user_id)
        else:
            resumes = await self.repository.get_all()
        
        return [
            ResumeDTO(
                resume_id=r.resume_id,
                candidate_name=r.candidate_name,
                file_name=r.file_name,
                file_path=r.file_path,
                uploaded_at=r.uploaded_at,
                is_indexed=r.is_indexed,
                vector_index_id=r.vector_index_id
            )
            for r in resumes
        ]
