from dataclasses import dataclass
from datetime import datetime
from typing import final
from uuid import UUID

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UserDTO:
    user_id: UUID
    created_at: datetime
    email: str
    full_name: str
    is_active: bool
    is_hirer: bool
    last_login: datetime | None = None



@final
@dataclass(frozen=True, slots=True, kw_only=True)
class CreateUserDTO:
    email: str
    full_name: str
    plain_password: str
    is_hirer: bool = False

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class LoginDTO:
    email: str
    plain_password: str

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class AuthTokenDTO:
    access_token: str
    token_type: str = "bearer"
    user: UserDTO
