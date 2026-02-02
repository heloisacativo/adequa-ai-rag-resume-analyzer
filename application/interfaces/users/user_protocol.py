from typing import Protocol, Optional
from uuid import UUID
from datetime import datetime
from application.dtos.users.user import UserDTO, CreateUserDTO

class UserRepositoryProtocol(Protocol):
    def create(self, data: CreateUserDTO) -> UserDTO:
        ...
    def get_by_email(self, email: str) -> Optional[UserDTO]:
        """
        Busca um usuário pelo e-mail.

        Args:
            email (str): E-mail do usuário.

        Returns:
            Optional[UserDTO]: O DTO do usuário se encontrado, senão None.
        """
        ...
    def get_by_id(self, user_id: UUID) -> Optional[UserDTO]:
        ...
    def update_last_login(self, user_id: UUID, last_login: datetime) -> None:
        ...
    def update_current_session(self, user_id: UUID, session_id: Optional[str]) -> None:
        """
        Atualiza a sessão atual do usuário.

        Args:
            user_id (UUID): ID do usuário.
            session_id (Optional[str]): ID da sessão atual ou None para limpar.
        """
        ...