"""Mock temporário do repositório de currículos."""
from uuid import UUID
from domain.entities.resumes.resume import ResumeEntity


class ResumeRepositoryMock:
    """Mock temporário - não persiste dados."""
    
    def __init__(self):
        self._storage: dict[UUID, ResumeEntity] = {}
    
    async def add(self, resume: ResumeEntity) -> None:
        """Adiciona um currículo ao repositório (mock)."""
        self._storage[resume.resume_id] = resume
    
    async def get_by_id(self, resume_id: UUID) -> ResumeEntity | None:
        """Busca um currículo por ID."""
        return self._storage.get(resume_id)
    
    async def get_by_vector_index_id(self, index_id: str) -> list[ResumeEntity]:
        """Busca todos os currículos de um índice vetorial."""
        return [
            resume for resume in self._storage.values()
            if resume.vector_index_id == index_id
        ]
    
    async def exists_by_file_name(self, file_name: str) -> bool:
        """Verifica se um currículo com esse nome de arquivo já existe."""
        return any(
            resume.file_name == file_name
            for resume in self._storage.values()
        )
    
    async def get_all_vector_index_ids(self) -> list[str]:
        """Busca todos os IDs únicos de índices vetoriais."""
        index_ids = set()
        for resume in self._storage.values():
            if resume.vector_index_id:
                index_ids.add(resume.vector_index_id)
        return list(index_ids)
    
    async def get_by_user_id(self, user_id: UUID) -> list[ResumeEntity]:
        """Busca todos os currículos de um usuário."""
        return [
            resume for resume in self._storage.values()
            if resume.uploaded_by_user_id == user_id
        ]
    
    async def get_all(self) -> list[ResumeEntity]:
        """Busca todos os currículos."""
        return list(self._storage.values())
    
    async def delete(self, resume_id: UUID) -> bool:
        """Remove um currículo por ID."""
        import os
        if resume_id in self._storage:
            resume = self._storage[resume_id]
            # Delete the file from filesystem
            if os.path.exists(resume.file_path):
                try:
                    os.remove(resume.file_path)
                except OSError:
                    # Log error but don't fail the deletion
                    pass
            del self._storage[resume_id]
            return True
        return False