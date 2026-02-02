from dataclasses import dataclass
from typing import ClassVar, final
from domain.exceptions import InvalidEmailException

@dataclass(frozen=True, kw_only=True)
class Email:
    value: str 

    def __post_init__(self):
        if "@" not in self.value or "." not in self.value:
            raise InvalidEmailException(f"Invalid email address: {self.value}") 