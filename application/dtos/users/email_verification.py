# application/dtos/users/email_verification.py
from dataclasses import dataclass
from datetime import datetime


@dataclass
class EmailVerificationDTO:
    """DTO para resposta de verificação de email."""
    email: str
    verification_id: str
    expires_at: datetime