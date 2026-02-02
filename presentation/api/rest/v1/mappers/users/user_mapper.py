from dataclasses import dataclass
from typing import final

from application.dtos.users.user import AuthTokenDTO, UserDTO
from presentation.api.rest.v1.schemas.responses import (
    AuthTokenResponseSchema,
    UserResponseSchema
)

@final
@dataclass(frozen=True, slots=True)
class UserPresentationMapper:
    def user_to_response(self, dto: UserDTO) -> UserResponseSchema:
        return UserResponseSchema(
            user_id=dto.user_id,
            created_at=dto.created_at,
            email=dto.email,
            full_name=dto.full_name,
            is_active=dto.is_active,
            is_hirer=dto.is_hirer,
            last_login=dto.last_login,
        )
    
def auth_to_response(self, dto: AuthTokenDTO) -> AuthTokenResponseSchema:
        return AuthTokenResponseSchema(
            access_token=dto.access_token,
            token_type=dto.token_type,
            user=self.user_to_response(dto.user)
            )