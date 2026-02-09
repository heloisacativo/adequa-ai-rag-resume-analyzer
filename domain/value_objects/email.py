from dataclasses import dataclass
from typing import ClassVar, final
import re
from domain.exceptions import InvalidEmailException


@dataclass(frozen=True, kw_only=True)
class Email:
    value: str

    def __post_init__(self):
        self._validate_email_format(self.value)

    @staticmethod
    def _validate_email_format(email: str) -> None:
        """Valida o formato do email usando regex."""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not email or not re.match(email_pattern, email):
            raise InvalidEmailException(f"Invalid email address: {email}")

        if len(email) > 254:
            raise InvalidEmailException(f"Email too long: {email}")