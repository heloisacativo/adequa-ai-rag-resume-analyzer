"""Protocol para repositório de currículos."""
from typing import Protocol
from uuid import UUID

from domain.entities.resumes.resume import ResumeEntity


class ResumeRepositoryProtocol(Protocol):
    """Protocol para operações de repositório de currículos."""
    
    async def add(self, resume: ResumeEntity) -> None:
        """Adiciona um currículo ao repositório."""
        ...
    
    async def get_by_id(self, resume_id: UUID) -> ResumeEntity | None:
        """Busca um currículo por ID."""
        ...
    
    async def get_by_vector_index_id(self, index_id: str) -> list[ResumeEntity]:
        """Busca todos os currículos de um índice vetorial."""
        ...
    
    async def exists_by_file_name(self, file_name: str) -> bool:
        """Verifica se um currículo com esse nome de arquivo já existe."""
        ...
    
    async def get_all_vector_index_ids(self) -> list[str]:
        """Busca todos os IDs únicos de índices vetoriais."""
        ...
    
    async def get_by_user_id(self, user_id: UUID) -> list[ResumeEntity]:
        """Busca todos os currículos de um usuário."""
        ...
    
    async def count_by_user_id(self, user_id: UUID) -> int:
        """Conta o número de currículos de um usuário."""
        ...
    
    async def get_all(self) -> list[ResumeEntity]:
        """Busca todos os currículos."""
        ...
    
    async def delete(self, resume_id: UUID) -> bool:
        """Remove um currículo por ID. Retorna True se removido, False se não encontrado."""
        ...