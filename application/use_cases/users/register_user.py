from dataclasses import dataclass
from datetime import UTC, datetime
from typing import final
from uuid import uuid4

from application.dtos.users.user import CreateUserDTO, UserDTO
from application.interfaces.users.repositories import UserRepositoryProtocol
from application.interfaces.security import PasswordHasherProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from application.mappers.users.user_mapper import UserMapper
from domain.entities.users.user import UserEntity
from domain.exceptions import UserAlreadyExistsError
from domain.value_objects.email import Email

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class RegisterUserUseCase:
    uow: UnitOfWorkProtocol
    repository: UserRepositoryProtocol
    password_hasher: PasswordHasherProtocol
    mapper: UserMapper

    async def __call__(self, dto: CreateUserDTO) -> UserDTO:
        exists = await self.repository.exists_by_email(dto.email)
        if exists:
            raise UserAlreadyExistsError(f"User with email {dto.email} already exists.")
        
        hashed_password = self.password_hasher.hash_password(dto.plain_password)

        user_entity = UserEntity(
            user_id=uuid4(),
            created_at=datetime.now(UTC),  
            email=Email(value=dto.email),
            full_name=dto.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_hirer=dto.is_hirer,
            last_login=None
        )

        async with self.uow:
            await self.repository.save(user_entity)

        return self.mapper.to_dto(user_entity)