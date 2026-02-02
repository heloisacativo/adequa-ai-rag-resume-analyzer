from dataclasses import dataclass
from typing import final

from application.interfaces.security import PasswordHasherProtocol
from domain.entities.users.user import UserEntity
from domain.exceptions import InvalidCredentialsError, UserInactiveError


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class AuthenticationService:
    """
    Application service for user authentication.
    
    This is NOT a domain service because it depends on infrastructure
    (PasswordHasherProtocol) and only deals with a single entity.
    """
    
    password_hasher: PasswordHasherProtocol
    
    def verify_credentials(
        self,
        user: UserEntity,
        plain_password: str,
    ) -> bool:
        """
        Verify user credentials following business rules.
        
        Raises:
            UserInactiveError: If user account is inactive
            InvalidCredentialsError: If password doesn't match
        """
        # Regra de negócio: usuário inativo não pode fazer login
        if not user.is_active:
            raise UserInactiveError("User account is inactive")
        
        print("Senha digitada:", plain_password)
        print("Hash salvo:", user.hashed_password)
        is_valid = self.password_hasher.verify_password(plain_password, user.hashed_password)
        print("Senha confere?", is_valid)
        
        if not is_valid:
            raise InvalidCredentialsError("Invalid credentials")
        
        return True