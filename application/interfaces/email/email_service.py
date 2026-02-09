from abc import ABC, abstractmethod


class EmailServiceProtocol(ABC):
    """Protocolo para serviço de envio de emails."""

    @abstractmethod
    async def send_verification_code(self, email: str, code: str, full_name: str) -> bool:
        """Envia código de verificação por email."""
        pass

    @abstractmethod
    async def send_welcome_email(self, email: str, full_name: str) -> bool:
        """Envia email de boas-vindas."""
        pass