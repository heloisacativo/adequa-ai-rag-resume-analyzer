from abc import abstractmethod
from typing import Protocol

from application.dtos.users.user import UserDTO
from domain.entities.users.user import UserEntity

class UserDtoEntityMapperProtocol(Protocol):
    """Protocol for Application layer mapper (Domain User Entity <-> Application User DTO)."""

    @abstractmethod
    def to_dto(self, entity: UserEntity) -> UserDTO:
        """Converts a Domain User Entity to an Application User DTO."""
        ...

    @abstractmethod
    def to_entity(self, dto: UserDTO) -> UserEntity:
        """Converts an Application User DTO to a Domain User Entity."""
        ...