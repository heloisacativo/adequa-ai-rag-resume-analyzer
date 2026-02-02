"""Chat session entity."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True, kw_only=True)
class ChatSessionEntity:
    """Represents a chat session."""

    session_id: UUID
    user_id: UUID
    title: str
    created_at: datetime