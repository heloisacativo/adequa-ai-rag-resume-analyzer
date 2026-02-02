from dataclasses import dataclass
from typing import ClassVar, final
from domain.exceptions import InvalidCPFException

@dataclass(frozen=True, kw_only=True)
class CPF:
    value: str

    def __post_init__(self):
        if not self._is_valid_cpf(self.value):
            raise InvalidCPFException()
        
    