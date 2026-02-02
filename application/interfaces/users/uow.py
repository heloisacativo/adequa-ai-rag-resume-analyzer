from abc import abstractmethod
from typing import Protocol

from application.interfaces.users.repositories import UserRepositoryProtocol


class UnitOfWorkProtocol(Protocol):
    """
    Protocol for a Unit of Work.

    This protocol defines the interface for managing transactions and
    the lifecycle of repositories within a single business transaction.
    """

    repository: UserRepositoryProtocol

    @abstractmethod
    async def __aenter__(self) -> "UnitOfWorkProtocol":
        """Enters the asynchronous context manager."""
        ...

    @abstractmethod
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exits the asynchronous context manager."""
        ...

    @abstractmethod
    async def commit(self) -> None:
        """Commits the current transaction."""
        ...

    @abstractmethod
    async def rollback(self) -> None:
        """Rolls back the current transaction."""
        ...
