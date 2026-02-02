from application.dtos.users.user import UserDTO, CreateUserDTO
from domain.entities.users.user import UserEntity

class UserMapper:
    def to_dto(self, entity: UserEntity) -> UserDTO:
        email_value = entity.email.value if hasattr(entity.email, "value") else entity.email
        return UserDTO(
            user_id=entity.user_id,
            email=email_value,
            full_name=entity.full_name,
            is_active=entity.is_active,
            is_hirer=entity.is_hirer,
            last_login=entity.last_login,
            created_at=entity.created_at,
        )

    def from_create_dto(self, dto: CreateUserDTO, hashed_password: str) -> UserEntity:
        return UserEntity(
            user_id=None,
            email=dto.email,
            full_name=dto.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_hirer=False,
            last_login=None,
            created_at=None,
        )