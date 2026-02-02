"""Garante que existe um usuário para associar ao upload de currículos (quando auth não está em uso)."""

import os

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import final
from uuid import UUID

from application.interfaces.security import PasswordHasherProtocol
from application.interfaces.users.repositories import UserRepositoryProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from domain.entities.users.user import UserEntity
from domain.value_objects.email import Email

# ID fixo usado pelo endpoint de upload quando não há usuário autenticado (TODO: remover quando auth estiver ativo)
RESUME_UPLOAD_USER_ID = UUID("56067bd3-fa0a-4a86-b1d4-713720d63309")
# Email de sistema único para não colidir com usuários reais em produção
SYSTEM_EMAIL = "resume-upload@system.local"
SYSTEM_FULL_NAME = "Resume Upload"
def _get_system_password() -> str:
    """Senha do usuário de sistema - deve vir do .env (RESUME_UPLOAD_SYSTEM_PASSWORD)."""
    pwd = os.getenv("RESUME_UPLOAD_SYSTEM_PASSWORD", "")
    if not pwd and os.getenv("USE_SQLITE", "true").lower() != "true":
        raise ValueError(
            "RESUME_UPLOAD_SYSTEM_PASSWORD deve ser definida no .env para upload de currículos."
        )
    return pwd or "dev-system-upload"  # fallback APENAS para SQLite local


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class EnsureResumeUploadUserUseCase:
    """Cria o usuário de upload se não existir (evita FK violation sem depender de SQL manual)."""

    uow: UnitOfWorkProtocol
    repository: UserRepositoryProtocol
    password_hasher: PasswordHasherProtocol

    async def execute(self, user_id: UUID) -> None:
        """Se o usuário não existir, cria um usuário mínimo para satisfazer a FK de resumes."""
        existing = await self.repository.get_by_user_id(user_id)
        if existing is not None:
            return

        # Suporta tanto .hash_password (implementação atual) quanto .hash (protocolo)
        hasher = self.password_hasher
        system_password = _get_system_password()
        if hasattr(hasher, "hash_password"):
            hashed = hasher.hash_password(system_password)
        else:
            hashed = hasher.hash(system_password)

        user = UserEntity(
            user_id=user_id,
            created_at=datetime.now(UTC),
            email=Email(value=SYSTEM_EMAIL),
            full_name=SYSTEM_FULL_NAME,
            hashed_password=hashed,
            is_active=True,
            is_hirer=False,
            last_login=None,
        )

        try:
            async with self.uow:
                await self.repository.save(user)
        except Exception as e:
            # Concorrência ou email já existente: outro request já criou o usuário; segue normalmente
            if "Conflict" not in type(e).__name__ and "IntegrityError" not in type(e).__name__:
                raise
