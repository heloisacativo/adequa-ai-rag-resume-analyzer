from abc import abstractmethod
from typing import Protocol

from application.dtos.users.user import UserDTO


class SerializationMapperProtocol(Protocol):
    """Protocol for serialization/deserialization of UserDTOs.

    This interface allows the Application layer to serialize DTOs
    without depending on Infrastructure implementations.
    """

    @abstractmethod
    def to_dict(self, dto: UserDTO) -> dict:
        """
        Converts a UserDTO to a dictionary for serialization.

        Args:
            dto: The UserDTO to convert.

        Returns:
            A dictionary representation of the DTO.
        """
        ...

    @abstractmethod
    def from_dict(self, data: dict) -> UserDTO:
        """
        Converts a dictionary from deserialization back to an UserDTO.

        Args:
            data: The dictionary to convert.

        Returns:
            An UserDTO object.
        """
        ...
