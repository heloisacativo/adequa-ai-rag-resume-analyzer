from dataclasses import dataclass
from typing import final
from uuid import UUID

from domain.entities.users.user import UserEntity
from domain.value_objects.email import Email
from infrastructures.db.models.users.user import UserModel

@final
@dataclass(frozen=True, slots=True)
class UserDBMapper:
    @staticmethod
    def to_entity(model: UserModel) -> UserEntity:
        return UserEntity(
            user_id=UUID(model.user_id),
            created_at=model.created_at,
            email=Email(value=model.email),
            full_name=model.full_name,
            hashed_password=model.hashed_password,
            is_active=model.is_active,
            is_hirer=model.is_hirer,
        )

    @staticmethod
    def to_model(entity: UserEntity) -> UserModel:
        return UserModel(
            user_id=str(entity.user_id),
            created_at=entity.created_at,
            email=entity.email.value,
            full_name=entity.full_name,
            hashed_password=entity.hashed_password,
            is_active=entity.is_active,
            is_hirer=entity.is_hirer,
        )
    
    def update_model_from_entity(model: UserModel, entity: UserEntity) -> None:
        model.email = entity.email.value
        model.full_name = entity.full_name
        model.hashed_password = entity.hashed_password
        model.is_active = entity.is_active
        model.is_hirer = entity.is_hirer
        model.last_login = entity.last_login