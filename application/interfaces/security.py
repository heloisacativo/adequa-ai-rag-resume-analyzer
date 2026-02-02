from typing import Protocol


class PasswordHasherProtocol(Protocol):
    """Protocol for password hashing operations."""

    def hash(self, plain_password: str) -> str:
        """Hash a plain password."""
        ...

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        ...


class TokenGeneratorProtocol(Protocol):
    """Protocol for JWT token generation."""

    def generate_token(self, user_id: str, user_type: str) -> str:
        """Generate JWT access token."""
        ...

    def decode_token(self, token: str) -> dict:
        """Decode and validate JWT token."""
        ...