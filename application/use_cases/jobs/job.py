"""Use cases for job management."""
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import final
from uuid import uuid4, UUID

from application.dtos.jobs.job import CreateJobDTO, UpdateJobDTO, JobDTO, JobListDTO
from application.interfaces.jobs.repositories import JobRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from domain.entities.jobs.job import JobEntity, JobType, JobStatus


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CreateJobUseCase:
    """Use case for creating a new job."""

    repository: JobRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, dto: CreateJobDTO, user_id: UUID) -> JobDTO:
        # Verificar limite de 30 vagas por usuário
        existing_jobs_count = await self.repository.count_by_user_id(user_id)
        if existing_jobs_count >= 30:
            from application.exceptions import BusinessRuleViolationError
            raise BusinessRuleViolationError("Limite máximo de 30 vagas por usuário atingido")
        
        # Map DTO enum values to domain enum values
        type_mapping = {
            "full-time": "FULL_TIME",
            "part-time": "PART_TIME",
            "contract": "CONTRACT",
            "freelance": "FREELANCE"
        }
        status_mapping = {
            "active": "ACTIVE",
            "inactive": "INACTIVE",
            "filled": "FILLED"
        }
        
        job_entity = JobEntity(
            job_id=uuid4(),
            created_by_user_id=user_id,
            title=dto.title,
            description=dto.description,
            requirements=dto.requirements,
            location=dto.location,
            salary=dto.salary,
            type=JobType(type_mapping[dto.type.value]),
            status=JobStatus(status_mapping[dto.status.value]),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        async with self.uow:
            await self.repository.save(job_entity)

        return self._entity_to_dto(job_entity)

    def _entity_to_dto(self, entity: JobEntity) -> JobDTO:
        """Convert JobEntity to JobDTO."""
        # Map domain enum values to DTO enum values
        type_mapping = {
            "FULL_TIME": "full-time",
            "PART_TIME": "part-time",
            "CONTRACT": "contract",
            "FREELANCE": "freelance"
        }
        status_mapping = {
            "ACTIVE": "active",
            "INACTIVE": "inactive",
            "FILLED": "filled"
        }
        
        return JobDTO(
            id=str(entity.job_id),
            title=entity.title,
            description=entity.description,
            requirements=entity.requirements,
            location=entity.location,
            salary=entity.salary,
            type=type_mapping[entity.type.value],
            status=status_mapping[entity.status.value],
            created_at=entity.created_at.isoformat(),
            updated_at=entity.updated_at.isoformat(),
        )


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ListJobsUseCase:
    """Use case for listing jobs."""

    repository: JobRepositoryProtocol

    async def __call__(self, user_id: UUID | None = None) -> JobListDTO:
        if user_id:
            jobs = await self.repository.get_all_by_user_id(user_id)
        else:
            jobs = await self.repository.get_all_active()

        job_dtos = [self._entity_to_dto(job) for job in jobs]

        return JobListDTO(
            jobs=job_dtos,
            total=len(job_dtos)
        )

    def _entity_to_dto(self, entity: JobEntity) -> JobDTO:
        """Convert JobEntity to JobDTO."""
        # Map domain enum values to DTO enum values
        type_mapping = {
            "FULL_TIME": "full-time",
            "PART_TIME": "part-time",
            "CONTRACT": "contract",
            "FREELANCE": "freelance"
        }
        status_mapping = {
            "ACTIVE": "active",
            "INACTIVE": "inactive",
            "FILLED": "filled"
        }
        
        return JobDTO(
            id=str(entity.job_id),
            title=entity.title,
            description=entity.description,
            requirements=entity.requirements,
            location=entity.location,
            salary=entity.salary,
            type=type_mapping[entity.type.value],
            status=status_mapping[entity.status.value],
            created_at=entity.created_at.isoformat(),
            updated_at=entity.updated_at.isoformat(),
        )


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class GetJobUseCase:
    """Use case for getting a specific job."""

    repository: JobRepositoryProtocol

    async def __call__(self, job_id: UUID) -> JobDTO | None:
        job = await self.repository.get_by_job_id(job_id)
        if not job:
            return None

        return self._entity_to_dto(job)

    def _entity_to_dto(self, entity: JobEntity) -> JobDTO:
        """Convert JobEntity to JobDTO."""
        # Map domain enum values to DTO enum values
        type_mapping = {
            "FULL_TIME": "full-time",
            "PART_TIME": "part-time",
            "CONTRACT": "contract",
            "FREELANCE": "freelance"
        }
        status_mapping = {
            "ACTIVE": "active",
            "INACTIVE": "inactive",
            "FILLED": "filled"
        }
        
        return JobDTO(
            id=str(entity.job_id),
            title=entity.title,
            description=entity.description,
            requirements=entity.requirements,
            location=entity.location,
            salary=entity.salary,
            type=type_mapping[entity.type.value],
            status=status_mapping[entity.status.value],
            created_at=entity.created_at.isoformat(),
            updated_at=entity.updated_at.isoformat(),
        )


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UpdateJobUseCase:
    """Use case for updating a job."""

    repository: JobRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, job_id: UUID, dto: UpdateJobDTO) -> JobDTO | None:
        job = await self.repository.get_by_job_id(job_id)
        if not job:
            return None

        # Update only provided fields
        # Map DTO enum values to domain enum values if provided
        type_mapping = {
            "full-time": JobType.FULL_TIME,
            "part-time": JobType.PART_TIME,
            "contract": JobType.CONTRACT,
            "freelance": JobType.FREELANCE
        }
        status_mapping = {
            "active": JobStatus.ACTIVE,
            "inactive": JobStatus.INACTIVE,
            "filled": JobStatus.FILLED
        }
        
        updated_job = JobEntity(
            job_id=job.job_id,
            created_by_user_id=job.created_by_user_id,
            title=dto.title if dto.title is not None else job.title,
            description=dto.description if dto.description is not None else job.description,
            requirements=dto.requirements if dto.requirements is not None else job.requirements,
            location=dto.location if dto.location is not None else job.location,
            salary=dto.salary if dto.salary is not None else job.salary,
            type=type_mapping[dto.type.value] if dto.type is not None else job.type,
            status=status_mapping[dto.status.value] if dto.status is not None else job.status,
            created_at=job.created_at,
            updated_at=datetime.now(UTC),
        )

        async with self.uow:
            await self.repository.save(updated_job)

        return self._entity_to_dto(updated_job)

    def _entity_to_dto(self, entity: JobEntity) -> JobDTO:
        """Convert JobEntity to JobDTO."""
        # Map domain enum values to DTO enum values
        type_mapping = {
            "FULL_TIME": "full-time",
            "PART_TIME": "part-time",
            "CONTRACT": "contract",
            "FREELANCE": "freelance"
        }
        status_mapping = {
            "ACTIVE": "active",
            "INACTIVE": "inactive",
            "FILLED": "filled"
        }
        
        return JobDTO(
            id=str(entity.job_id),
            title=entity.title,
            description=entity.description,
            requirements=entity.requirements,
            location=entity.location,
            salary=entity.salary,
            type=type_mapping[entity.type.value],
            status=status_mapping[entity.status.value],
            created_at=entity.created_at.isoformat(),
            updated_at=entity.updated_at.isoformat(),
        )


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class DeleteJobUseCase:
    """Use case for deleting a job."""

    repository: JobRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, job_id: UUID) -> bool:
        job = await self.repository.get_by_job_id(job_id)
        if not job:
            return False

        async with self.uow:
            await self.repository.delete(job_id)

        return True


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UpdateJobStatusUseCase:
    """Use case for updating job status."""

    repository: JobRepositoryProtocol
    uow: UnitOfWorkProtocol

    async def __call__(self, job_id: UUID, status: str) -> JobDTO | None:
        job = await self.repository.get_by_job_id(job_id)
        if not job:
            return None

        # Map string status to domain enum
        status_mapping = {
            "active": JobStatus.ACTIVE,
            "inactive": JobStatus.INACTIVE,
            "filled": JobStatus.FILLED
        }
        
        job_status = status_mapping[status]

        async with self.uow:
            await self.repository.update_status(job_id, job_status)

        # Get updated job
        updated_job = await self.repository.get_by_job_id(job_id)
        if not updated_job:
            return None

        return self._entity_to_dto(updated_job)

    def _entity_to_dto(self, entity: JobEntity) -> JobDTO:
        """Convert JobEntity to JobDTO."""
        # Map domain enum values to DTO enum values
        type_mapping = {
            "FULL_TIME": "full-time",
            "PART_TIME": "part-time",
            "CONTRACT": "contract",
            "FREELANCE": "freelance"
        }
        status_mapping = {
            "ACTIVE": "active",
            "INACTIVE": "inactive",
            "FILLED": "filled"
        }
        
        return JobDTO(
            id=str(entity.job_id),
            title=entity.title,
            description=entity.description,
            requirements=entity.requirements,
            location=entity.location,
            salary=entity.salary,
            type=type_mapping[entity.type.value],
            status=status_mapping[entity.status.value],
            created_at=entity.created_at.isoformat(),
            updated_at=entity.updated_at.isoformat(),
        )