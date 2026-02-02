"""Use case para deletar um currículo."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.interfaces.resumes.repositories import ResumeRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class DeleteResumeUseCase:
    """Use case para deletar um currículo."""
    
    uow: UnitOfWorkProtocol
    repository: ResumeRepositoryProtocol
    
    async def execute(self, resume_id: UUID, user_id: UUID | None = None) -> bool:
        """
        Deleta um currículo.
        
        Args:
            resume_id: ID do currículo a ser deletado
            user_id: Se fornecido, verifica se o currículo pertence ao usuário
        
        Returns:
            True se deletado, False se não encontrado
        """
        # Se user_id fornecido, verificar se o currículo pertence ao usuário
        if user_id:
            resume = await self.repository.get_by_id(resume_id)
            if resume and resume.uploaded_by_user_id != user_id:
                return False  # Não autorizado
        
        async with self.uow:
            return await self.repository.delete(resume_id)