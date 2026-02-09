from typing import final
from uuid import UUID
from application.interfaces.users.email_verification_repository import EmailVerificationRepositoryProtocol
from domain.entities.users.email_verification import EmailVerificationEntity


@final
class InMemoryEmailVerificationRepository(EmailVerificationRepositoryProtocol):
    """Repositório em memória para verificação de email (para desenvolvimento)."""

    def __init__(self):
        self._storage: dict[str, EmailVerificationEntity] = {}

    async def save(self, verification: EmailVerificationEntity) -> None:
        """Salva um registro de verificação de email."""
        self._storage[verification.email] = verification

    async def find_by_email(self, email: str) -> EmailVerificationEntity | None:
        """Encontra verificação por email."""
        return self._storage.get(email)

    async def update(self, verification: EmailVerificationEntity) -> None:
        """Atualiza um registro de verificação."""
        self._storage[verification.email] = verification

    async def delete(self, verification_id: UUID) -> None:
        """Deleta um registro de verificação."""
        email_to_delete = None
        for email, ver in self._storage.items():
            if ver.verification_id == verification_id:
                email_to_delete = email
                break
        if email_to_delete:
            del self._storage[email_to_delete]
