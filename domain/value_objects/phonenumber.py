from dataclasses import dataclass
from domain.exceptions import InvalidPhoneNumberException


@dataclass(frozen=True, kw_only=True)
class PhoneNumber:
    value: str
    country_code: str = "+55"

    def __post_init__(self):
        if len(self.value) != 55:
            raise InvalidPhoneNumberException()