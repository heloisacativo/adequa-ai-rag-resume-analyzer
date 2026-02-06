"""SQLAlchemy model for ResumeGroup and membership."""
from uuid import uuid4
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, registry
from sqlalchemy.sql import func

from infrastructures.db.models.users.user import mapper_registry


@mapper_registry.mapped
class ResumeGroupModel:
    __tablename__ = "resume_groups"

    group_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


@mapper_registry.mapped
class ResumeGroupMemberModel:
    __tablename__ = "resume_group_members"

    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("resume_groups.group_id", ondelete="CASCADE"), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.resume_id", ondelete="CASCADE"), primary_key=True)
