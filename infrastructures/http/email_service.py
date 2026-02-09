import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import final
from application.interfaces.email.email_service import EmailServiceProtocol
from config.settings import Settings


@final
class SMTPEmailService(EmailServiceProtocol):
    """Serviço de envio de emails via SMTP."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.smtp_server = settings.external_apis.smtp_server
        self.smtp_port = settings.external_apis.smtp_port
        self.email_sender = settings.external_apis.email_sender
        self.email_password = settings.external_apis.email_password

    async def send_verification_code(self, email: str, code: str, full_name: str) -> bool:
        """Envia código de verificação por email."""
        try:
            subject = "Código de Verificação - Adequa AI"
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Bem-vindo, {full_name}!</h2>
                    <p>Para completar seu cadastro, use o código abaixo:</p>
                    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #333; letter-spacing: 5px;">{code}</h1>
                    </div>
                    <p style="color: #666; font-size: 12px;">
                        Este código expira em 30 minutos.<br>
                        Se não solicitou este código, ignore este email.
                    </p>
                </body>
            </html>
            """
            
            return await self._send_email(email, subject, html_body)
        except Exception as e:
            print(f"Erro ao enviar email de verificação: {e}")
            return False

    async def send_welcome_email(self, email: str, full_name: str) -> bool:
        """Envia email de boas-vindas."""
        try:
            subject = "Bem-vindo ao Adequa AI!"
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Bem-vindo, {full_name}!</h2>
                    <p>Sua conta foi criada com sucesso.</p>
                    <p>Agora você pode acessar a plataforma Adequa AI.</p>
                    <p style="color: #666; font-size: 12px;">
                        Se tiver dúvidas, entre em contato conosco.
                    </p>
                </body>
            </html>
            """
            
            return await self._send_email(email, subject, html_body)
        except Exception as e:
            print(f"Erro ao enviar email de boas-vindas: {e}")
            return False

    async def _send_email(self, recipient: str, subject: str, html_body: str) -> bool:
        """Método interno para enviar emails."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.email_sender
            msg["To"] = recipient

            part = MIMEText(html_body, "html")
            msg.attach(part)

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_sender, self.email_password)
                server.sendmail(self.email_sender, recipient, msg.as_string())

            return True
        except Exception as e:
            print(f"Erro ao enviar email: {e}")
            return False