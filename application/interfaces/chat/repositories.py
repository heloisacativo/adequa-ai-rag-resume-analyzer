from abc import abstractmethod
from typing import Protocol, List
from uuid import UUID

from domain.entities.chat.chat_session import ChatSessionEntity
from domain.entities.chat.chat_message import ChatMessageEntity


class ChatRepositoryProtocol(Protocol):
    @abstractmethod
    async def create_session(self, session: ChatSessionEntity) -> None:
        """Create a new chat session."""
        ...

    @abstractmethod
    async def get_sessions_by_user(self, user_id: UUID) -> List[ChatSessionEntity]:
        """Get all chat sessions for a user."""
        ...

    @abstractmethod
    async def get_session_by_id(self, session_id: UUID) -> ChatSessionEntity | None:
        """Get a chat session by ID."""
        ...

    @abstractmethod
    async def add_message(self, message: ChatMessageEntity) -> None:
        """Add a message to a chat session."""
        ...

    @abstractmethod
    async def get_messages_by_session(self, session_id: UUID) -> List[ChatMessageEntity]:
        """Get all messages for a chat session."""
        ...