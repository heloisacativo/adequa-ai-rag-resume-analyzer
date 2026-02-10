import smtplib
import socket
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
        """Método interno para enviar emails via SMTP com fallback para múltiplas portas."""
        self.logger.info(f"📧 Tentando enviar email...")
        self.logger.info(f"   De: {self.email_sender}")
        self.logger.info(f"   Para: {recipient}")
        
        # Prepara a mensagem
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.email_sender
        msg["To"] = recipient
        part = MIMEText(html_body, "html", "utf-8")
        msg.attach(part)
        
        # Tenta múltiplas configurações (porta 465 SSL e porta 587 STARTTLS)
        configs = [
            {"port": 465, "use_ssl": True, "name": "SSL (porta 465)"},
            {"port": 587, "use_ssl": False, "name": "STARTTLS (porta 587)"},
        ]
        
        for config in configs:
            try:
                port = config["port"]
                use_ssl = config["use_ssl"]
                config_name = config["name"]
                
                self.logger.info(f"🔄 Tentando envio via {config_name}...")
                
                # Testa conectividade
                self.logger.info(f"🔍 Testando conectividade {self.smtp_server}:{port}...")
                try:
                    sock = socket.create_connection((self.smtp_server, port), timeout=5)
                    sock.close()
                    self.logger.info(f"✅ Porta {port} acessível")
                except (socket.timeout, socket.error) as e:
                    self.logger.warning(f"⚠️ Porta {port} não acessível: {e}")
                    continue
                
                # Tenta enviar usando a configuração atual
                if use_ssl:
                    # Porta 465 - SSL direto
                    self.logger.info(f"🔗 Conectando via SSL...")
                    with smtplib.SMTP_SSL(self.smtp_server, port, timeout=15) as server:
                        self.logger.info(f"🔑 Fazendo login com: {self.smtp_user}")
                        server.login(self.smtp_user, self.email_password)
                        self.logger.info(f"📤 Enviando mensagem...")
                        server.sendmail(self.email_sender, recipient, msg.as_string())
                else:
                    # Porta 587 - STARTTLS
                    self.logger.info(f"🔗 Conectando via STARTTLS...")
                    with smtplib.SMTP(self.smtp_server, port, timeout=15) as server:
                        self.logger.info(f"🔐 Iniciando TLS...")
                        server.starttls()
                        self.logger.info(f"🔑 Fazendo login com: {self.smtp_user}")
                        server.login(self.smtp_user, self.email_password)
                        self.logger.info(f"📤 Enviando mensagem...")
                        server.sendmail(self.email_sender, recipient, msg.as_string())
                
                self.logger.info(f"✅ Email enviado com sucesso via {config_name}!")
                return True
                
            except smtplib.SMTPAuthenticationError as e:
                self.logger.error(f"❌ Erro de autenticação em {config_name}: {e}")
                self.logger.error(f"   Verifique SMTP_USER ({self.smtp_user}) e EMAIL_PASSWORD")
                continue
            except (socket.timeout, smtplib.SMTPException) as e:
                self.logger.warning(f"⚠️ Falha em {config_name}: {e}")
                continue
            except Exception as e:
                self.logger.warning(f"⚠️ Erro inesperado em {config_name}: {type(e).__name__} - {e}")
                continue
        
        # Se chegou aqui, todas as tentativas falharam
        self.logger.error(f"❌ FALHA: Não foi possível enviar email após tentar todas as configurações")
        self.logger.error(f"   Possíveis soluções:")
        self.logger.error(f"   1. Verifique se seu firewall permite conexões nas portas 465 e 587")
        self.logger.error(f"   2. Confirme se as credenciais Brevo estão corretas no arquivo .env")
        self.logger.error(f"   3. Teste sua conexão: telnet {self.smtp_server} 465")
        return False
