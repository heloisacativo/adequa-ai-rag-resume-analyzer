from dataclasses import dataclass
from typing import final
from application.dtos.candidates.job_application import CreateJobApplicationDTO, JobApplicationDTO
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from domain.entities.candidates.job_application import JobApplicationEntity, JobApplicationStatus
from datetime import datetime, UTC


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CreateJobApplicationUseCase:
    repository: JobApplicationRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, dto: CreateJobApplicationDTO, user_id: str) -> JobApplicationDTO:
        # DB uses TIMESTAMP WITHOUT TIME ZONE; pass naive UTC to avoid asyncpg offset-naive/aware error
        now_utc_naive = datetime.now(UTC).replace(tzinfo=None)
        entity = JobApplicationEntity(
            id=0,  # will be set by db
            user_id=user_id,
            company_name=dto.company_name,
            job_title=dto.job_title,
            application_date=dto.application_date,
            description=dto.description,
            status=JobApplicationStatus.APPLIED,
            created_at=now_utc_naive,
            updated_at=None,
        )
        async with self.uow:
            created = await self.repository.create(entity)
        return JobApplicationDTO(
            id=created.id,
            user_id=created.user_id,
            company_name=created.company_name,
            job_title=created.job_title,
            application_date=created.application_date,
            description=created.description,
            status=created.status.value,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )