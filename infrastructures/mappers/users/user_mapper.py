from dataclasses import dataclass
from datetime import datetime
from typing import final
from uuid import UUID

from application.dtos.users.user import UserDTO
from application.interfaces.users.serialization import SerializationMapperProtocol

@final
@dataclass(frozen=True, slots=True)
class InfrastructureUserMapper(SerializationMapperProtocol):
    """Mapper for converting UserDTOs to dictionaries for external API communication."""

    def to_dict(self, dto: UserDTO) -> dict:
        return {
            "user_id": str(dto.user_id),
            "created_at": dto.created_at.isoformat(),
            "email": dto.email,
            "full_name": dto.full_name,
            "is_active": dto.is_active,
            "is_hirer": dto.is_hirer,
            "last_login": dto.last_login.isoformat() if dto.last_login else None,
        }

    def from_dict(self, data: dict) -> UserDTO:
        return UserDTO(
            user_id=UUID(data["user_id"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            email=data["email"],
            full_name=data["full_name"],
            is_active=data["is_active"],
            is_hirer=data["is_hirer"],
            last_login=datetime.fromisoformat(data["last_login"]) if data.get("last_login") else None,
        )