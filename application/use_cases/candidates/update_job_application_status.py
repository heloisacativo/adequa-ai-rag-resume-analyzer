from dataclasses import dataclass
from typing import final
from application.dtos.candidates.job_application import UpdateJobApplicationStatusDTO, JobApplicationDTO
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from domain.entities.candidates.job_application import JobApplicationStatus
from datetime import datetime, UTC


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UpdateJobApplicationStatusUseCase:
    repository: JobApplicationRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, id: int, dto: UpdateJobApplicationStatusDTO, user_id: str) -> JobApplicationDTO:
        entity = await self.repository.get_by_id(id)
        if not entity or entity.user_id != user_id:
            raise ValueError("Not found or not authorized")
        entity.status = JobApplicationStatus(dto.status)
        entity.updated_at = datetime.now(UTC)
        async with self.uow:
            updated = await self.repository.update(entity)
        return JobApplicationDTO(
            id=updated.id,
            user_id=updated.user_id,
            company_name=updated.company_name,
            job_title=updated.job_title,
            application_date=updated.application_date,
            description=updated.description,
            status=updated.status.value,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )