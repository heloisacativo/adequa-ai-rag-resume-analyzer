import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import final
import logging

from application.interfaces.email.email_service import EmailServiceProtocol
from config.external_apis import ExternalAPISettings


@final
class SMTPEmailService(EmailServiceProtocol):
    """Serviço de envio de emails via SMTP (Brevo)."""

    def __init__(self, settings: ExternalAPISettings):
        self.settings = settings
        self.logger = logging.getLogger(__name__)
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.email_sender = settings.email_sender
        self.email_password = settings.email_password

    async def send_verification_code(self, email: str, code: str, full_name: str) -> bool:
        """Envia código de verificação por email."""
        try:
            subject = "Código de Verificação - Adequa AI"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                    .code-box {{ background-color: #fff; padding: 20px; border: 2px dashed #4F46E5; border-radius: 5px; text-align: center; margin: 20px 0; }}
                    .code {{ font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }}
                    .footer {{ background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Verificação de Email</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {full_name}!</h2>
                        <p>Você está quase lá! Para completar seu cadastro no <strong>Adequa AI</strong>, use o código abaixo:</p>
                        
                        <div class="code-box">
                            <div class="code">{code}</div>
                        </div>
                        
                        <p><strong>⏰ Este código expira em 30 minutos.</strong></p>
                        <p>Se você não solicitou este código, ignore este email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Adequa AI - Sistema de IA para avaliação de perfis profissionais</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return await self._send_email(email, subject, html_body)
        except Exception as e:
            self.logger.error(f"Erro ao enviar email de verificação: {e}")
            return False

    async def send_welcome_email(self, email: str, full_name: str) -> bool:
        """Envia email de boas-vindas."""
        try:
            subject = "Bem-vindo ao Adequa AI!"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                    .footer {{ background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👋 Bem-vindo!</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {full_name}!</h2>
                        <p>Sua conta foi criada com sucesso no <strong>Adequa AI</strong>!</p>
                        <p>Agora você pode aproveitar todas as funcionalidades da nossa plataforma de IA para avaliação de perfis profissionais.</p>
                        <p>Qualquer dúvida, estamos à disposição!</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Adequa AI - Sistema de IA para avaliação de perfis profissionais</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return await self._send_email(email, subject, html_body)
        except Exception as e:
            self.logger.error(f"Erro ao enviar email de boas-vindas: {e}")
            return False

    async def _send_email(self, recipient: str, subject: str, html_body: str) -> bool:
        """Método interno para enviar emails via SMTP."""
        try:
            self.logger.info(f"📧 Tentando enviar email...")
            self.logger.info(f"   De: {self.email_sender}")
            self.logger.info(f"   Para: {recipient}")
            self.logger.info(f"   Servidor: {self.smtp_server}:{self.smtp_port}")
            
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.email_sender
            msg["To"] = recipient

            part = MIMEText(html_body, "html", "utf-8")
            msg.attach(part)

            self.logger.info(f"🔗 Conectando ao servidor SMTP...")
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30) as server:
                server.set_debuglevel(1)  # Ativa debug do SMTP
                self.logger.info(f"🔐 Iniciando TLS...")
                server.starttls()
                self.logger.info(f"🔑 Fazendo login...")
                server.login(self.smtp_user, self.email_password)
                self.logger.info(f"📤 Enviando mensagem...")
                result = server.sendmail(self.email_sender, recipient, msg.as_string())
                self.logger.info(f"📬 Resultado do envio: {result}")

            self.logger.info(f"✅ Email enviado com sucesso para {recipient}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            self.logger.error(f"❌ Erro de autenticação SMTP: {e}")
            self.logger.error(f"   Verifique EMAIL_SENDER e EMAIL_PASSWORD no .env")
            return False
        except smtplib.SMTPException as e:
            self.logger.error(f"❌ Erro SMTP ao enviar email para {recipient}: {e}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Erro inesperado ao enviar email para {recipient}: {e}")
            return False
