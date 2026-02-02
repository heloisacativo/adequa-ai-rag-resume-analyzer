from passlib.context import CryptContext
from application.interfaces.security import PasswordHasherProtocol

class PasswordHasher(PasswordHasherProtocol):
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash_password(self, plain_password: str) -> str:
        return self.pwd_context.hash(plain_password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)