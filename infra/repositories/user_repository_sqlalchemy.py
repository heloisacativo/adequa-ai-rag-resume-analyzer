from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID
from typing import final


@dataclass(frozen=True, slots=True, kw_only=True)
class EmailVerificationEntity:
    """Entidade para armazenar tokens de verificação de email."""
    
    verification_id: UUID
    user_id: UUID
    email: str
    verification_code: str
    is_verified: bool
    created_at: datetime
    expires_at: datetime
    verified_at: datetime | None = None

    def is_expired(self) -> bool:
        """Verifica se o código de verificação expirou."""
        return datetime.now(UTC) > self.expires_at

    def is_valid_code(self, code: str) -> bool:
        """Valida o código fornecido."""
        return not self.is_expired() and self.verification_code == code