from dataclasses import dataclass
from datetime import UTC, datetime
from typing import final

from application.dtos.users.user import AuthTokenDTO, LoginDTO, UserDTO
from application.interfaces.users.repositories import UserRepositoryProtocol
from application.interfaces.security import TokenGeneratorProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from application.mappers import UserMapper
from domain.exceptions import InvalidCredentialsError
from application.services.users.auth import AuthenticationService
from domain.entities.users.user import UserEntity

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class LoginUserUseCase:

    uow: UnitOfWorkProtocol
    repository: UserRepositoryProtocol
    token_generator: TokenGeneratorProtocol
    mapper: UserMapper
    auth_service: AuthenticationService

    async def __call__(self, dto: LoginDTO) -> AuthTokenDTO:
        user_entity = await self.repository.get_by_email(dto.email)

        if not user_entity:
            raise InvalidCredentialsError("Invalid email or password.")
        
        self.auth_service.verify_credentials(user_entity, dto.plain_password)

        updated_user = UserEntity(
            **{**user_entity.__dict__, "last_login": datetime.now(UTC)}
        )

        async with self.uow:
            await self.repository.update(updated_user)

        access_token = self.token_generator.generate_token(
            user_id=str(user_entity.user_id),
            email=user_entity.email.value,
        )

        return AuthTokenDTO(
            access_token=access_token,
            token_type="bearer",
            user=self.mapper.to_dto(updated_user),
        )