from dataclasses import dataclass
from typing import final

from passlib.context import CryptContext

from application.interfaces.security import PasswordHasherProtocol

@final
@dataclass(frozen=True, slots=True)
class BcryptPasswordHasher(PasswordHasherProtocol):

    _context: CryptContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash(self, plain_password: str) -> str:
        """Hash a plain password using bcrypt algorithm."""
        return self._context.hash(plain_password)
    
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return self._context.verify(plain_password, hashed_password)