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
        Lista todos os índices vetoriais agrupados para o usuário específico.
        
        Args:
            user_id: ID do usuário para filtrar os currículos
            
        Returns:
            Dict com vector_index_id como chave e informações do índice
        """
        if not user_id:
            return {} 
        
        user_resumes = await self.repository.get_by_user_id(user_id)
        
        if not user_resumes:
            return {}  
        
        indexes_info = {}
        
        for resume in user_resumes:
            index_id = resume.vector_index_id
            if not index_id:
                continue 
            
            if index_id not in indexes_info:
                indexes_info[index_id] = {
                    "vector_index_id": index_id,
                    "resume_count": 0,
                    "first_uploaded_at": None,
                    "resumes": []
                }
            
            indexes_info[index_id]["resume_count"] += 1
            indexes_info[index_id]["resumes"].append({
                "resume_id": str(resume.resume_id),
                "candidate_name": resume.candidate_name,
                "file_name": resume.file_name,
                "uploaded_at": resume.uploaded_at.isoformat(),
                "is_indexed": resume.is_indexed
            })
            
            if (indexes_info[index_id]["first_uploaded_at"] is None or 
                resume.uploaded_at.isoformat() < indexes_info[index_id]["first_uploaded_at"]):
                indexes_info[index_id]["first_uploaded_at"] = resume.uploaded_at.isoformat()
        
        return indexes_info
