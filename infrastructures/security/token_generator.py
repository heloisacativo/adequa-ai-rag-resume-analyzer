from dataclasses import dataclass
from typing import final
from datetime import UTC, datetime, timedelta

import jwt

from application.interfaces.security import TokenGeneratorProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class JWTTokenGenerator(TokenGeneratorProtocol):
    secret_key: str
    algorithm: str = "HS256"
    expiration_minutes: int = 60

    def generate_token(self, user_id: str, email: str) -> str:
        expiration = datetime.now(tz=UTC) + timedelta(minutes=self.expiration_minutes)
        payload = {
            "sub": user_id,
            "email": email,
            "exp": expiration,
            "iat": datetime.now(tz=UTC)
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> dict:
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])