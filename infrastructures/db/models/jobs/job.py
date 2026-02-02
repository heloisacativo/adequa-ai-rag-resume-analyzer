"""SQLAlchemy model for Job entity."""
from uuid import uuid4
from sqlalchemy import String, DateTime, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, registry
from sqlalchemy.sql import func
import enum

# Import the registry from users model
from infrastructures.db.models.users.user import mapper_registry


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


@mapper_registry.mapped
class JobModel:
    """SQLAlchemy model for Job."""

    __tablename__ = "jobs"

    # Primary key
    job_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))

    # Foreign key to users (who created the job)
    created_by_user_id: Mapped[str] = mapped_column(String(36), nullable=False)

    # Job data
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    salary: Mapped[str] = mapped_column(String(100), nullable=True)
    type: Mapped[JobType] = mapped_column(Enum(JobType), default=JobType.FULL_TIME, nullable=False)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.ACTIVE, nullable=False)

    # Timestamps
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)