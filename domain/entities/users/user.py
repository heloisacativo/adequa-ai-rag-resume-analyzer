from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import final
from uuid import UUID

from domain.exceptions import DomainValidationError
from domain.value_objects.email import Email

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UserEntity:
    user_id: UUID
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    email: Email
    full_name: str
    hashed_password: str
    is_active: bool = True
    is_hirer: bool = False
    last_login: datetime | None = None  

    def __post_init__(self) -> None:
        if len(self.full_name) < 2 or len(self.full_name) > 100:
            raise DomainValidationError("Full name must be between 2 and 100 characters")
        
        if len(self.hashed_password) < 8:
            raise DomainValidationError("Password must be at least 8 characters long")