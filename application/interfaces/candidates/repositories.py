from typing import Protocol, Optional
from domain.entities.candidates.job_application import JobApplicationEntity


class JobApplicationRepositoryProtocol(Protocol):
    async def create(self, entity: JobApplicationEntity) -> JobApplicationEntity:
        ...

    async def get_by_id(self, id: int) -> Optional[JobApplicationEntity]:
        ...

    async def get_by_user_id(self, user_id: str) -> list[JobApplicationEntity]:
        ...

    async def update(self, entity: JobApplicationEntity) -> JobApplicationEntity:
        ...

    async def delete(self, id: int) -> None:
        ...