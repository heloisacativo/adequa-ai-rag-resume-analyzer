"""Set (replace) resumes in a group."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.interfaces.resumes.resume_group_repository import ResumeGroupRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class SetGroupResumesUseCase:
    repository: ResumeGroupRepositoryProtocol

    async def execute(self, group_id: str, resume_ids: list[str], user_id: UUID) -> bool:
        return await self.repository.set_resumes(group_id, resume_ids, user_id)
