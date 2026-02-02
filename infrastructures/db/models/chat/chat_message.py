from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, registry

# Import the shared registry from users model
from infrastructures.db.models.users.user import mapper_registry


@mapper_registry.mapped
class ChatMessageModel:
    """SQLAlchemy model for chat_messages table."""
    
    __tablename__ = "chat_messages"
    
    def __init__(
        self,
        *,
        message_id: str,
        session_id: str,
        sender: str,
        text: str,
        timestamp: datetime,
    ) -> None:
        self.message_id = message_id
        self.session_id = session_id
        self.sender = sender
        self.text = text
        self.timestamp = timestamp
    
    message_id: Mapped[str] = mapped_column(String(36), primary_key=True, nullable=False)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("chat_sessions.session_id"), nullable=False)
    sender: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "Usuário", "Assistente"
    text: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
    )