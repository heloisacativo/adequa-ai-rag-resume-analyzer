"""Job DTOs for API layer."""
from dataclasses import dataclass
from typing import final, Optional
from uuid import UUID
from datetime import datetime
import enum


class JobTypeDTO(enum.Enum):
    """Enum for job types in DTO."""
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    FREELANCE = "freelance"


class JobStatusDTO(enum.Enum):
    """Enum for job statuses in DTO."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    FILLED = "filled"


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CreateJobDTO:
    """DTO for creating a new job."""
    title: str
    description: str
    requirements: Optional[str] = None
    location: str
    salary: Optional[str] = None
    type: JobTypeDTO = JobTypeDTO.FULL_TIME
    status: JobStatusDTO = JobStatusDTO.ACTIVE


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UpdateJobDTO:
    """DTO for updating an existing job."""
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    type: Optional[JobTypeDTO] = None
    status: Optional[JobStatusDTO] = None


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class JobDTO:
    """DTO for job response."""
    id: str
    title: str
    description: str
    requirements: Optional[str]
    location: str
    salary: Optional[str]
    type: str
    status: str
    created_at: str
    updated_at: str


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class JobListDTO:
    """DTO for job list response."""
    jobs: list[JobDTO]
    total: int