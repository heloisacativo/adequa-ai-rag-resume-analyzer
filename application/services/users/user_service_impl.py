from typing import Optional
from uuid import UUID

from application.dtos.users.user import UserDTO
from application.interfaces.users.repositories import UserRepositoryProtocol
from application.services.users.user_service import UserServiceProtocol


class UserService(UserServiceProtocol):
    """Service for user operations."""

    def __init__(self, user_repository: UserRepositoryProtocol):
        self.user_repository = user_repository

    async def get_user_by_id(self, user_id: UUID) -> UserDTO:
        """Get a user by ID."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        return user

    async def update_current_session(self, user_id: UUID, session_id: Optional[str]) -> None:
        """Update the current session for a user."""
        self.user_repository.update_current_session(user_id, session_id)