from dataclasses import dataclass
from datetime import UTC, datetime
from typing import final

from application.interfaces.users.email_verification_repository import EmailVerificationRepositoryProtocol
from domain.entities.users.email_verification import EmailVerificationEntity
from domain.exceptions import InvalidEmailException


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class VerifyEmailCodeUseCase:
    """Caso de uso para verificar código de email."""
    
    email_verification_repo: EmailVerificationRepositoryProtocol

    async def __call__(self, email: str, code: str) -> bool:
        verification = await self.email_verification_repo.find_by_email(email)
        
        if not verification:
            raise InvalidEmailException(f"Nenhuma verificação pendente para: {email}")
        
        if verification.is_verified:
            raise InvalidEmailException(f"Email já verificado: {email}")
        
        if not verification.is_valid_code(code):
            raise InvalidEmailException("Código de verificação inválido ou expirado")
        
        # Marca como verificado
        verified = EmailVerificationEntity(
            verification_id=verification.verification_id,
            email=verification.email,
            verification_code=verification.verification_code,
            is_verified=True,
            created_at=verification.created_at,
            expires_at=verification.expires_at,
            verified_at=datetime.now(UTC)
        )
        
        await self.email_verification_repo.update(verified)
        return True