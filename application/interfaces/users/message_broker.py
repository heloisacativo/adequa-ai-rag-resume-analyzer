from abc import abstractmethod
from typing import Protocol

from application.dtos.users.user import UserDTO


class MessageBrokerPublisherProtocol(Protocol):
    """
    Protocol for publishing messages to a message broker.
    """

    @abstractmethod
    async def publish_new_user(
        self, user: UserDTO
    ) -> None:
        """
        Publishes a new user registration notification to the message broker.

        Args:
            user: The UserDTO to publish.
        """
        ...
