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

    MAX_SESSIONS_PER_USER = 10

    async def create_session(self, user_id: UUID, title: str) -> ChatSessionEntity:
        """Create a new chat session. Keeps at most MAX_SESSIONS_PER_USER; oldest is deleted."""
        session = ChatSessionEntity(
            session_id=uuid4(),
            user_id=user_id,
            title=title,
            created_at=datetime.now(UTC),
        )
        await self.chat_repository.create_session(session)
        # Manter no máximo 10 conversas: remover as mais antigas
        all_sessions = await self.chat_repository.get_sessions_by_user(user_id)
        for old_session in all_sessions[self.MAX_SESSIONS_PER_USER:]:
            await self.chat_repository.delete_session(old_session.session_id)
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

    async def delete_session(self, session_id: UUID, user_id: UUID) -> bool:
        """
        Delete a chat session if it belongs to the user. Returns True if deleted, False if not found or not owner.
        """
        session = await self.chat_repository.get_session_by_id(session_id)
        if session is None or session.user_id != user_id:
            return False
        await self.chat_repository.delete_session(session_id)
        return True

    async def update_session_title(self, session_id: UUID, title: str, user_id: UUID) -> bool:
        """
        Update the title of a chat session if it belongs to the user. Returns True if updated, False if not found or not owner.
        """
        session = await self.chat_repository.get_session_by_id(session_id)
        if session is None or session.user_id != user_id:
            return False
        await self.chat_repository.update_session_title(session_id, title.strip() or session.title)
        return True