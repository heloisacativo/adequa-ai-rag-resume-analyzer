import logging
from dataclasses import dataclass
from typing import final, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from application.interfaces.users.repositories import UserRepositoryProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol
from application.interfaces.jobs.repositories import JobRepositoryProtocol
from application.interfaces.chat.repositories import ChatRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol

logger = logging.getLogger(__name__)


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UnitOfWorkSQLAlchemy(UnitOfWorkProtocol):
    """SQLAlchemy implementation of Unit of Work pattern for users and resumes."""

    session: AsyncSession
    repository: UserRepositoryProtocol
    resume_repository: Optional[ResumeRepositoryProtocol] = None
    job_repository: Optional[JobRepositoryProtocol] = None
    chat_repository: Optional[ChatRepositoryProtocol] = None

    async def __aenter__(self) -> "UnitOfWorkSQLAlchemy":
        """
        Enters the asynchronous context manager.
        Returns this UOW instance.
        """
        logger.debug("Starting database transaction")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """
        Exits the asynchronous context manager.
        Commits changes if no exception occurred, otherwise rolls back.
        """
        if exc_type is not None:
            logger.warning(
                "Transaction rolled back due to exception: %s - %s",
                exc_type.__name__,
                str(exc_val)
            )
            await self.rollback()
        else:
            await self.commit()

    async def commit(self) -> None:
        """
        Commits the current transaction to the database.
        """
        logger.debug("Committing transaction")
        await self.session.commit()
        logger.debug("Transaction committed successfully")

    async def rollback(self) -> None:
        """
        Rolls back the current transaction.
        """
        logger.debug("Rolling back transaction")
        await self.session.rollback()
        logger.debug("Transaction rolled back successfully")
