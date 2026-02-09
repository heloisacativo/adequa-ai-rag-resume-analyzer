from abc import ABC, abstractmethod
from uuid import UUID

from domain.entities.users.email_verification import EmailVerificationEntity


class EmailVerificationRepositoryProtocol(ABC):
    """Protocolo para repositório de verificação de email."""

    @abstractmethod
    async def save(self, verification: EmailVerificationEntity) -> None:
        """Salva um registro de verificação de email."""
        pass

    @abstractmethod
    async def find_by_email(self, email: str) -> EmailVerificationEntity | None:
        """Encontra verificação por email."""
        pass

    @abstractmethod
    async def update(self, verification: EmailVerificationEntity) -> None:
        """Atualiza um registro de verificação."""
        pass

    @abstractmethod
    async def delete(self, verification_id: UUID) -> None:
        """Deleta um registro de verificação."""
        pass