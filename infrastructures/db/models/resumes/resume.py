"""SQLAlchemy model for Resume entity."""
from uuid import uuid4
from sqlalchemy import String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry
from sqlalchemy.sql import func

# Import the registry from users model
from infrastructures.db.models.users.user import mapper_registry

@mapper_registry.mapped
class ResumeModel:
    """SQLAlchemy model for Resume."""

    __tablename__ = "resumes"

    # Primary key
    resume_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))

    # Foreign key to users
    uploaded_by_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)

    # Resume data
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)

    # Vector index
    vector_index_id: Mapped[str] = mapped_column(String(255), nullable=True)
    is_indexed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)