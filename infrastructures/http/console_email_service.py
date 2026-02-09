from typing import final
import logging

from application.interfaces.email.email_service import EmailServiceProtocol


@final
class ConsoleEmailService(EmailServiceProtocol):
    """Serviço de email que imprime no console (para desenvolvimento)."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def send_verification_code(self, email: str, code: str, full_name: str) -> bool:
        """Envia código de verificação por email (imprime no console)."""
        self.logger.info(f"""
        ========================================
        📧 EMAIL DE VERIFICAÇÃO
        ========================================
        Para: {email}
        Nome: {full_name}
        
        Seu código de verificação é:
        
        🔐 {code}
        
        Este código expira em 30 minutos.
        ========================================
        """)
        print(f"\n🔐 CÓDIGO DE VERIFICAÇÃO para {email}: {code}\n")
        return True

    async def send_welcome_email(self, email: str, full_name: str) -> bool:
        """Envia email de boas-vindas (imprime no console)."""
        self.logger.info(f"""
        ========================================
        👋 EMAIL DE BOAS-VINDAS
        ========================================
        Para: {email}
        Nome: {full_name}
        
        Bem-vindo ao Adequa AI!
        Sua conta foi criada com sucesso.
        ========================================
        """)
        print(f"\n👋 BEM-VINDO {full_name} ({email})!\n")
        return True
