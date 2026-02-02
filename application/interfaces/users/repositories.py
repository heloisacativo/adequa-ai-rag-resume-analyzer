from abc import abstractmethod
from typing import Protocol
from uuid import UUID

from domain.entities.users.user import UserEntity

class UserRepositoryProtocol(Protocol):
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> UserEntity | None:
        """Retrieves a user by their user ID."""
        ...

    @abstractmethod
    async def get_by_email(self, email: str) -> UserEntity | None:
        """Retrieves a user by their email address."""
        ...

    @abstractmethod
    async def save(self, user: UserEntity) -> None:
        """Saves a new user or updates an existing one."""
        ...

    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """Checks if a user exists with the given email address."""
        ...