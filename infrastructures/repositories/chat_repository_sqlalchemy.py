"""SQLAlchemy repository for Chat entities."""
from uuid import UUID
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete, update

from domain.entities.chat.chat_session import ChatSessionEntity
from domain.entities.chat.chat_message import ChatMessageEntity
from infrastructures.db.models.chat.chat_session import ChatSessionModel
from infrastructures.db.models.chat.chat_message import ChatMessageModel


class ChatRepositorySqlAlchemy:
    """SQLAlchemy implementation of ChatRepositoryProtocol."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(self, session: ChatSessionEntity) -> None:
        """Create a new chat session."""
        model = ChatSessionModel(
            session_id=str(session.session_id),
            user_id=str(session.user_id),
            title=session.title,
            created_at=session.created_at,
        )
        self.session.add(model)

    async def get_sessions_by_user(self, user_id: UUID) -> List[ChatSessionEntity]:
        """Get all chat sessions for a user."""
        stmt = select(ChatSessionModel).where(ChatSessionModel.user_id == str(user_id)).order_by(desc(ChatSessionModel.created_at))
        result = await self.session.execute(stmt)
        models = result.scalars().all()

        return [
            ChatSessionEntity(
                session_id=UUID(model.session_id),
                user_id=UUID(model.user_id),
                title=model.title,
                created_at=model.created_at,
            )
            for model in models
        ]

    async def get_session_by_id(self, session_id: UUID) -> Optional[ChatSessionEntity]:
        """Get a chat session by ID."""
        stmt = select(ChatSessionModel).where(ChatSessionModel.session_id == str(session_id))
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return ChatSessionEntity(
            session_id=UUID(model.session_id),
            user_id=UUID(model.user_id),
            title=model.title,
            created_at=model.created_at,
        )

    async def add_message(self, message: ChatMessageEntity) -> None:
        """Add a message to a chat session."""
        model = ChatMessageModel(
            message_id=str(message.message_id),
            session_id=str(message.session_id),
            sender=message.sender,
            text=message.text,
            timestamp=message.timestamp,
        )
        self.session.add(model)

    async def get_messages_by_session(self, session_id: UUID) -> List[ChatMessageEntity]:
        """Get all messages for a chat session."""
        stmt = select(ChatMessageModel).where(ChatMessageModel.session_id == str(session_id)).order_by(ChatMessageModel.timestamp)
        result = await self.session.execute(stmt)
        models = result.scalars().all()

        return [
            ChatMessageEntity(
                message_id=UUID(model.message_id),
                session_id=UUID(model.session_id),
                sender=model.sender,
                text=model.text,
                timestamp=model.timestamp,
            )
            for model in models
        ]

    async def delete_session(self, session_id: UUID) -> None:
        """Delete a chat session and its messages (messages first due to FK)."""
        await self.session.execute(delete(ChatMessageModel).where(ChatMessageModel.session_id == str(session_id)))
        await self.session.execute(delete(ChatSessionModel).where(ChatSessionModel.session_id == str(session_id)))

    async def update_session_title(self, session_id: UUID, title: str) -> None:
        """Update the title of a chat session."""
        await self.session.execute(
            update(ChatSessionModel).where(ChatSessionModel.session_id == str(session_id)).values(title=title)
        )