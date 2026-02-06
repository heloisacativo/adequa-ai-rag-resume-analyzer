"""List resume groups for a user."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.interfaces.resumes.resume_group_repository import ResumeGroupRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ListResumeGroupsUseCase:
    repository: ResumeGroupRepositoryProtocol

    async def execute(self, user_id: UUID) -> list[dict]:
        return await self.repository.list_by_user_id(user_id)
