from dataclasses import dataclass
from typing import final, List
from uuid import UUID, uuid4
from datetime import datetime, UTC

from application.interfaces.chat.repositories import ChatRepositoryProtocol
from domain.entities.chat.chat_session import ChatSessionEntity
from domain.entities.chat.chat_message import ChatMessageEntity


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ChatService:
    """Application service for chat operations."""

    chat_repository: ChatRepositoryProtocol

    async def create_session(self, user_id: UUID, title: str) -> ChatSessionEntity:
        """Create a new chat session."""
        session = ChatSessionEntity(
            session_id=uuid4(),
            user_id=user_id,
            title=title,
            created_at=datetime.now(UTC),
        )
        await self.chat_repository.create_session(session)
        return session

    async def get_user_sessions(self, user_id: UUID) -> List[ChatSessionEntity]:
        """Get all chat sessions for a user."""
        return await self.chat_repository.get_sessions_by_user(user_id)

    async def get_session(self, session_id: UUID) -> ChatSessionEntity | None:
        """Get a chat session by ID."""
        return await self.chat_repository.get_session_by_id(session_id)

    async def add_message(self, session_id: UUID, sender: str, text: str) -> ChatMessageEntity:
        """Add a message to a chat session."""
        message = ChatMessageEntity(
            message_id=uuid4(),
            session_id=session_id,
            sender=sender,
            text=text,
            timestamp=datetime.now(UTC),
        )
        await self.chat_repository.add_message(message)
        return message

    async def get_session_messages(self, session_id: UUID) -> List[ChatMessageEntity]:
        """Get all messages for a chat session."""
        return await self.chat_repository.get_messages_by_session(session_id)