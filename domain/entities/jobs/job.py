"""Job entity for domain layer."""
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import final
from uuid import UUID
import enum


class JobType(enum.Enum):
    """Enum for job types."""
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    FREELANCE = "FREELANCE"


class JobStatus(enum.Enum):
    """Enum for job statuses."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FILLED = "FILLED"


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class JobEntity:
    """Job entity for domain layer."""

    job_id: UUID
    created_by_user_id: UUID
    title: str
    description: str
    requirements: str | None
    location: str
    salary: str | None
    type: JobType = JobType.FULL_TIME
    status: JobStatus = JobStatus.ACTIVE
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def __post_init__(self) -> None:
        if len(self.title.strip()) < 2:
            raise ValueError("Job title must be at least 2 characters long")

        if len(self.description.strip()) < 10:
            raise ValueError("Job description must be at least 10 characters long")

        if len(self.location.strip()) < 2:
            raise ValueError("Job location must be at least 2 characters long")