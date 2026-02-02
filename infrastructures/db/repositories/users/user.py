from dataclasses import dataclass
from typing import final
from uuid import UUID

from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from application.interfaces.users.repositories import UserRepositoryProtocol
from domain.entities.users.user import UserEntity
from infrastructures.db.exceptions import RepositoryConflictError, RepositorySaveError
from infrastructures.db.mappers.users.user_db_mapper import UserDBMapper
from infrastructures.db.models.users.user import UserModel

@final
@dataclass(frozen=True, slots=True)
class UserRepositorySQLAlchemy(UserRepositoryProtocol):
    session: AsyncSession
    mapper: UserDBMapper

    async def get_by_user_id(self, user_id: UUID) -> UserEntity | None:
        try:
            stmt = select(UserModel).where(UserModel.user_id == str(user_id))
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()
            return self.mapper.to_entity(model) if model else None
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error retrieving user with ID {user_id}: {e}") from e
        
    async def get_by_email(self, email: str) -> UserEntity | None:
        try:
            stmt = select(UserModel).where(UserModel.email == email)
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()
            return self.mapper.to_entity(model) if model else None
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error retrieving user with email {email}: {e}") from e
        
    async def save(self, user: UserEntity) -> None:
        try:
            stmt = select(UserModel).where(UserModel.user_id == str(user.user_id))
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()

            if model:
                self.mapper.update_model_from_entity(model, user)
            else: 
                model = self.mapper.to_model(user)

            self.session.add(model)
        except IntegrityError as e:
            raise RepositoryConflictError(f"Conflict saving user with ID {user.user_id}: {e}") from e
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error saving user with ID {user.user_id}: {e}") from e

    async def exists_by_email(self, email: str) -> bool:
        try:
            stmt = select(UserModel).where(UserModel.email == email)
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()
            return model is not None
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error checking existence of user with email {email}: {e}") from e
        
    async def update(self, user: UserEntity) -> None:
        # Exemplo básico, ajuste conforme seu ORM
        stmt = select(UserModel).where(UserModel.user_id == str(user.user_id))
        result = await self.session.execute(stmt)
        db_user = result.scalar_one_or_none()

        if db_user:
            db_user.last_login = user.last_login
            # Atualize outros campos se necessário
            await self.session.commit()

    async def get_by_id(self, user_id: UUID) -> UserEntity | None:
        """Get user by ID (alias for get_by_user_id)."""
        return await self.get_by_user_id(user_id)

    async def update_current_session(self, user_id: UUID, session_id: str | None) -> None:
        """Update the current session for a user."""
        try:
            stmt = select(UserModel).where(UserModel.user_id == str(user_id))
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()

            if model:
                model.current_session_id = session_id
                await self.session.commit()
            else:
                raise RepositorySaveError(f"User with ID {user_id} not found")
        except SQLAlchemyError as e:
            raise RepositorySaveError(f"Error updating current session for user {user_id}: {e}") from e