from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, registry

# Import the shared registry from users model
from infrastructures.db.models.users.user import mapper_registry


@mapper_registry.mapped
class ChatSessionModel:
    """SQLAlchemy model for chat_sessions table."""
    
    __tablename__ = "chat_sessions"
    
    def __init__(
        self,
        *,
        session_id: str,
        user_id: str,
        title: str,
        created_at: datetime,
    ) -> None:
        self.session_id = session_id
        self.user_id = user_id
        self.title = title
        self.created_at = created_at
    
    session_id: Mapped[str] = mapped_column(String(36), primary_key=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
    )