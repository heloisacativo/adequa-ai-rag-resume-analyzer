from domain.entities.users.user import UserEntity
from application.dtos.users.user import UserDTO

class UserMapper:
    @staticmethod
    def to_dto(entity: UserEntity) -> UserDTO:
        return UserDTO(
            user_id=entity.user_id,
            created_at=entity.created_at,
            email=entity.email.value,
            full_name=entity.full_name,
            is_active=entity.is_active,
            is_hirer=entity.is_hirer,
            last_login=entity.last_login,
        )

    @staticmethod
    def to_entity(dto: UserDTO) -> UserEntity:
        return UserEntity(
            user_id=dto.user_id,
            created_at=dto.created_at,
            email=dto.email,  # ajuste se UserEntity espera um value object
            full_name=dto.full_name,
            is_active=dto.is_active,
            is_hirer=dto.is_hirer,
            last_login=dto.last_login,
        )