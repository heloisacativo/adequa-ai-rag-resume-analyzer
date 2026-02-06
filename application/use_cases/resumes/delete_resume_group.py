"""Delete a resume group."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.interfaces.resumes.resume_group_repository import ResumeGroupRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class DeleteResumeGroupUseCase:
    repository: ResumeGroupRepositoryProtocol

    async def execute(self, group_id: str, user_id: UUID) -> bool:
        return await self.repository.delete(group_id, user_id)
