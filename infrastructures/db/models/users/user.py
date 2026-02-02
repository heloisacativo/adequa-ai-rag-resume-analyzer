from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, registry

mapper_registry = registry()


@mapper_registry.mapped
class UserModel:
    """SQLAlchemy model for users table."""
    
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
    )
    
    def __init__(
        self,
        *,
        user_id: str,
        created_at: datetime,
        email: str,
        full_name: str,
        hashed_password: str,
        is_active: bool = True,
        is_hirer: bool = False,
        last_login: datetime | None = None,
        current_session_id: str | None = None,
    ) -> None:
        self.user_id = user_id
        self.created_at = created_at
        self.email = email
        self.full_name = full_name
        self.hashed_password = hashed_password
        self.is_active = is_active
        self.is_hirer = is_hirer
        self.last_login = last_login
        self.current_session_id = current_session_id
    
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_hirer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    
    def __repr__(self) -> str:
        return f"<UserModel(user_id={self.user_id}, email={self.email})>"