"""Use case para listar índices vetoriais salvos."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.dtos.resumes.resume import ResumeDTO
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ListIndexesUseCase:
    """Use case para listar índices vetoriais com seus currículos."""
    
    repository: ResumeRepositoryProtocol
    
    async def execute(self, user_id: UUID | None = None) -> dict[str, dict]:
        """
        Lista todos os índices vetoriais agrupados.
        
        Returns:
            Dict com vector_index_id como chave e informações do índice
        """
        # Busca todos os índices únicos
        all_index_ids = await self.repository.get_all_vector_index_ids()
        
        indexes_info = {}
        
        # Para cada índice, busca os currículos e agrega informações
        for index_id in all_index_ids:
            resumes = await self.repository.get_by_vector_index_id(index_id)
            
            # Filtra por usuário se fornecido
            if user_id:
                resumes = [r for r in resumes if r.uploaded_by_user_id == user_id]
            
            if not resumes:
                continue
            
            # Agrega informações
            indexes_info[index_id] = {
                "vector_index_id": index_id,
                "resume_count": len(resumes),
                "first_uploaded_at": min(r.uploaded_at for r in resumes).isoformat(),
                "resumes": [
                    {
                        "resume_id": str(r.resume_id),
                        "candidate_name": r.candidate_name,
                        "file_name": r.file_name,
                        "uploaded_at": r.uploaded_at.isoformat(),
                        "is_indexed": r.is_indexed
                    }
                    for r in resumes
                ]
            }
        
        return indexes_info
