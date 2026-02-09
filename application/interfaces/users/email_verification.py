from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import final
from uuid import UUID


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class EmailVerificationEntity:
    """Entidade para armazenar tokens de verificação de email."""
    
    verification_id: UUID
    email: str
    verification_code: str
    is_verified: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime | None = None
    verified_at: datetime | None = None

    def is_expired(self) -> bool:
        """Verifica se o código de verificação expirou."""
        if self.expires_at is None:
            return False
        return datetime.now(UTC) > self.expires_at

    def is_valid_code(self, code: str) -> bool:
        """Valida o código fornecido."""
        return not self.is_expired() and self.verification_code == code