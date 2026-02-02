from typing import Protocol, Optional
from uuid import UUID

from application.dtos.users.user import UserDTO


class UserServiceProtocol(Protocol):
    """Protocol for user service operations."""

    async def get_user_by_id(self, user_id: UUID) -> UserDTO:
        """
        Get a user by ID.

        Args:
            user_id (UUID): The user ID.

        Returns:
            UserDTO: The user data.
        """
        ...

    async def update_current_session(self, user_id: UUID, session_id: Optional[str]) -> None:
        """
        Update the current session for a user.

        Args:
            user_id (UUID): The user ID.
            session_id (Optional[str]): The session ID or None to clear.
        """
        ...