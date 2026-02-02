from dataclasses import dataclass
from typing import final
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class DeleteJobApplicationUseCase:
    repository: JobApplicationRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, id: int, user_id: str) -> None:
        async with self.uow:
            # First check if the application exists and belongs to the user
            entity = await self.repository.get_by_id(id)
            if not entity or entity.user_id != user_id:
                raise ValueError("Job application not found or access denied")
            await self.repository.delete(id)