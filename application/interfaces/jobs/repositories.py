"""Job repository protocol."""
from abc import abstractmethod
from typing import Protocol
from uuid import UUID

from domain.entities.jobs.job import JobEntity, JobStatus, JobType


class JobRepositoryProtocol(Protocol):
    """Protocol for job repository operations."""

    @abstractmethod
    async def get_by_job_id(self, job_id: UUID) -> JobEntity | None:
        """Retrieves a job by its job ID."""
        ...

    @abstractmethod
    async def get_all_by_user_id(self, user_id: UUID) -> list[JobEntity]:
        """Retrieves all jobs created by a specific user."""
        ...

    @abstractmethod
    async def get_all_active(self) -> list[JobEntity]:
        """Retrieves all active jobs."""
        ...

    @abstractmethod
    async def save(self, job: JobEntity) -> None:
        """Saves a new job or updates an existing one."""
        ...

    @abstractmethod
    async def delete(self, job_id: UUID) -> None:
        """Deletes a job by its ID."""
        ...

    @abstractmethod
    async def count_by_user_id(self, user_id: UUID) -> int:
        """Counts the number of jobs created by a specific user."""
        ...