import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import final
from uuid import uuid4

from application.dtos.users.email_verification import EmailVerificationDTO
from application.interfaces.users.email_verification_repository import EmailVerificationRepositoryProtocol
from application.interfaces.email.email_service import EmailServiceProtocol
from domain.entities.users.email_verification import EmailVerificationEntity
from domain.exceptions import InvalidEmailException
from domain.value_objects.email import Email


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class RequestEmailVerificationUseCase:
    """Caso de uso para solicitar verificação de email."""
    
    email_verification_repo: EmailVerificationRepositoryProtocol
    email_service: EmailServiceProtocol

    async def __call__(self, email: str, full_name: str) -> EmailVerificationDTO:
        # Valida o formato do email
        Email(value=email)
        
        # Gera código de 6 dígitos
        verification_code = self._generate_verification_code()
        
        # Verifica se já existe verificação pendente
        existing = await self.email_verification_repo.find_by_email(email)
        if existing and not existing.is_verified:
            verification_id = existing.verification_id
        else:
            verification_id = uuid4()
        
        # Cria entidade de verificação
        now = datetime.now(UTC)
        verification = EmailVerificationEntity(
            verification_id=verification_id,
            email=email,
            verification_code=verification_code,
            is_verified=False,
            created_at=now,
            expires_at=now + timedelta(minutes=30)
        )
        
        # Envia email
        success = await self.email_service.send_verification_code(
            email, verification_code, full_name
        )
        
        if not success:
            raise Exception("Erro ao enviar email de verificação")
        
        # Salva no banco
        await self.email_verification_repo.save(verification)
        
        return EmailVerificationDTO(
            email=email,
            verification_id=str(verification_id),
            expires_at=verification.expires_at
        )

    @staticmethod
    def _generate_verification_code() -> str:
        """Gera um código de verificação seguro."""
        return str(int.from_bytes(secrets.token_bytes(3), 'big') % 1000000).zfill(6)