"""Database mapper for Job entity."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from domain.entities.jobs.job import JobEntity, JobType, JobStatus
from infrastructures.db.models.jobs.job import JobModel


@final
@dataclass(frozen=True, slots=True)
class JobDBMapper:
    """Database mapper for Job entity."""

    @staticmethod
    def to_entity(model: JobModel) -> JobEntity:
        """Convert JobModel to JobEntity."""
        return JobEntity(
            job_id=UUID(model.job_id),
            created_by_user_id=UUID(model.created_by_user_id),
            title=model.title,
            description=model.description,
            requirements=model.requirements,
            location=model.location,
            salary=model.salary,
            type=JobType(model.type.value),
            status=JobStatus(model.status.value),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: JobEntity) -> JobModel:
        """Convert JobEntity to JobModel."""
        return JobModel(
            job_id=str(entity.job_id),
            created_by_user_id=str(entity.created_by_user_id),
            title=entity.title,
            description=entity.description,
            requirements=entity.requirements,
            location=entity.location,
            salary=entity.salary,
            type=entity.type.value,
            status=entity.status.value,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    @staticmethod
    def update_model_from_entity(model: JobModel, entity: JobEntity) -> None:
        """Update JobModel from JobEntity."""
        model.title = entity.title
        model.description = entity.description
        model.requirements = entity.requirements
        model.location = entity.location
        model.salary = entity.salary
        model.type = entity.type.value
        model.status = entity.status.value
        model.updated_at = entity.updated_at