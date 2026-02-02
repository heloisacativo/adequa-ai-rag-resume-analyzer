"""Chat message entity."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True, kw_only=True)
class ChatMessageEntity:
    """Represents a chat message."""

    message_id: UUID
    session_id: UUID
    sender: str
    text: str
    timestamp: datetime