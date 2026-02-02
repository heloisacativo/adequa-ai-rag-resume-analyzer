from typing import Protocol
from application.dtos.users.user import LoginDTO, AuthTokenDTO

class AuthServiceProtocol(Protocol):
    def authenticate(self, login: LoginDTO) -> AuthTokenDTO:
        ...
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        ...
    def hash_password(self, plain_password: str) -> str:
        ...