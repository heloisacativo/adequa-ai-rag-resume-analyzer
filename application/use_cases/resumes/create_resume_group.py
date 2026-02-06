"""Create a resume group."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.interfaces.resumes.resume_group_repository import ResumeGroupRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CreateResumeGroupUseCase:
    repository: ResumeGroupRepositoryProtocol

    async def execute(self, user_id: UUID, name: str) -> dict:
        if not (name and name.strip()):
            from application.exceptions import BusinessRuleViolationError
            raise BusinessRuleViolationError("Nome do grupo é obrigatório.")
        return await self.repository.create(user_id, name.strip())
