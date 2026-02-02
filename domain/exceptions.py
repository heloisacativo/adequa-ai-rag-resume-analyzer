from typing import final


@final
class InvalidMaterialException(Exception):
    """Raised when an invalid material is provided."""


@final
class InvalidEraException(Exception):
    """Raised when an invalid era is provided."""


@final
class DomainValidationError(Exception):
    """Raised when domain entity validation fails."""
    ...

@final
class InvalidEmailException(Exception):
    """Raised when an invalid email is provided."""
    ...

@final
class InvalidCPFException(Exception):
    """Raised when an invalid CPF is provided."""
    ...

@final 
class InvalidPhoneNumberException(Exception):
    """Raised when an invalid phone number is provided."""
    ...

@final
class UserInactiveError(Exception):
    """Raised when an inactive user attempts to authenticate."""
    ...

@final
class UserAlreadyExistsError(Exception):
    """Raised when an attempt is made to register an already existing user."""
    pass

@final
class InvalidCredentialsError(Exception):
    pass