"""SQLAlchemy repository for Job entity."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from application.interfaces.jobs.repositories import JobRepositoryProtocol
from domain.entities.jobs.job import JobEntity, JobStatus
from infrastructures.db.exceptions import RepositorySaveError
from infrastructures.db.mappers.jobs.job_db_mapper import JobDBMapper
from infrastructures.db.models.jobs.job import JobModel


@final
@dataclass(frozen=True, slots=True)
class JobRepositorySQLAlchemy(JobRepositoryProtocol):
    """SQLAlchemy implementation of JobRepositoryProtocol."""

    session: AsyncSession
    mapper: JobDBMapper

    async def get_by_job_id(self, job_id: UUID) -> JobEntity | None:
        """Retrieves a job by its job ID."""
        try:
            stmt = select(JobModel).where(JobModel.job_id == str(job_id))
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()
            return self.mapper.to_entity(model) if model else None
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error retrieving job with ID {job_id}: {e}") from e

    async def get_all_by_user_id(self, user_id: UUID) -> list[JobEntity]:
        """Retrieves all jobs created by a specific user."""
        try:
            stmt = select(JobModel).where(JobModel.created_by_user_id == str(user_id))
            result = await self.session.execute(stmt)
            models = result.scalars().all()
            return [self.mapper.to_entity(model) for model in models]
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error retrieving jobs for user {user_id}: {e}") from e

    async def get_all_active(self) -> list[JobEntity]:
        """Retrieves all active jobs."""
        try:
            stmt = select(JobModel).where(JobModel.status == JobStatus.ACTIVE.value)
            result = await self.session.execute(stmt)
            models = result.scalars().all()
            return [self.mapper.to_entity(model) for model in models]
        except SQLAlchemyError as e:
            raise RepositorySaveError("Error retrieving active jobs: {e}") from e

    async def save(self, job: JobEntity) -> None:
        """Saves a new job or updates an existing one."""
        try:
            stmt = select(JobModel).where(JobModel.job_id == str(job.job_id))
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()

            if model:
                self.mapper.update_model_from_entity(model, job)
            else:
                model = self.mapper.to_model(job)

            self.session.add(model)
        except IntegrityError as e:
            raise RepositorySaveError(f"Conflict saving job with ID {job.job_id}: {e}") from e
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error saving job with ID {job.job_id}: {e}") from e

    async def delete(self, job_id: UUID) -> None:
        """Deletes a job by its ID."""
        try:
            stmt = select(JobModel).where(JobModel.job_id == str(job_id))
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()

            if model:
                await self.session.delete(model)
            else:
                raise RepositorySaveError(f"Job with ID {job_id} not found")
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error deleting job with ID {job_id}: {e}") from e

    async def count_by_user_id(self, user_id: UUID) -> int:
        """Counts the number of jobs created by a specific user."""
        try:
            from sqlalchemy import func
            stmt = select(func.count(JobModel.job_id)).where(JobModel.created_by_user_id == str(user_id))
            result = await self.session.execute(stmt)
            return result.scalar_one()
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error counting jobs for user {user_id}: {e}") from e
            raise RepositorySaveError(f"Error updating status for job {job_id}: {e}") from e