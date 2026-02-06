"""
Repositório de chat que usa uma conexão separada (ex.: Supabase) para histórico de conversas.
Quando CHAT_DATABASE_URL está definido, o chat é persistido nesse banco em vez do SQLite/PythonAnywhere.
"""
from uuid import UUID
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.chat.repositories import ChatRepositoryProtocol
from domain.entities.chat.chat_session import ChatSessionEntity
from domain.entities.chat.chat_message import ChatMessageEntity
from infrastructures.repositories.chat_repository_sqlalchemy import ChatRepositorySqlAlchemy


class ChatRepositorySupabase(ChatRepositoryProtocol):
    """
    Usa uma session factory (ex.: conexão Supabase) e faz commit após cada operação.
    Assim o histórico de conversas fica no Supabase e o restante do app pode usar SQLite.
    """

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._session_factory = session_factory

    def _repo(self, session: AsyncSession) -> ChatRepositorySqlAlchemy:
        return ChatRepositorySqlAlchemy(session)

    async def create_session(self, session_entity: ChatSessionEntity) -> None:
        async with self._session_factory() as session:
            await self._repo(session).create_session(session_entity)
            await session.commit()

    async def get_sessions_by_user(self, user_id: UUID) -> List[ChatSessionEntity]:
        async with self._session_factory() as session:
            return await self._repo(session).get_sessions_by_user(user_id)

    async def get_session_by_id(self, session_id: UUID) -> Optional[ChatSessionEntity]:
        async with self._session_factory() as session:
            return await self._repo(session).get_session_by_id(session_id)

    async def add_message(self, message: ChatMessageEntity) -> None:
        async with self._session_factory() as session:
            await self._repo(session).add_message(message)
            await session.commit()

    async def get_messages_by_session(self, session_id: UUID) -> List[ChatMessageEntity]:
        async with self._session_factory() as session:
            return await self._repo(session).get_messages_by_session(session_id)

    async def delete_session(self, session_id: UUID) -> None:
        async with self._session_factory() as session:
            await self._repo(session).delete_session(session_id)
            await session.commit()

    async def update_session_title(self, session_id: UUID, title: str) -> None:
        async with self._session_factory() as session:
            await self._repo(session).update_session_title(session_id, title)
            await session.commit()
