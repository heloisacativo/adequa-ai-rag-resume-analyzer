import httpx
from typing import final
import logging

from application.interfaces.email.email_service import EmailServiceProtocol
from config.external_apis import ExternalAPISettings


@final
class BrevoAPIEmailService(EmailServiceProtocol):
    """Serviço de envio de emails via Brevo API (compatível com Hugging Face Spaces)."""

    def __init__(self, settings: ExternalAPISettings):
        self.settings = settings
        self.logger = logging.getLogger(__name__)
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.api_key = settings.brevo_api_key  
        self.email_sender = settings.email_sender

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
            
            return await self._send_email(email, subject, html_body, full_name)
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
            
            return await self._send_email(email, subject, html_body, full_name)
        except Exception as e:
            self.logger.error(f"Erro ao enviar email de boas-vindas: {e}")
            return False

    async def _send_email(self, recipient: str, subject: str, html_body: str, recipient_name: str = None) -> bool:
        """Método interno para enviar emails via Brevo API."""
        try:
            self.logger.info(f"📧 Enviando email via Brevo API...")
            self.logger.info(f"   De: {self.email_sender}")
            self.logger.info(f"   Para: {recipient}")
            
            # Valida API Key
            if not self.api_key or self.api_key == "your-brevo-api-key-here":
                self.logger.error(f"❌ BREVO_API_KEY não configurada no .env")
                return False
            
            # Prepara payload para API Brevo
            payload = {
                "sender": {
                    "name": "Adequa AI",
                    "email": self.email_sender
                },
                "to": [
                    {
                        "email": recipient,
                        "name": recipient_name or recipient
                    }
                ],
                "subject": subject,
                "htmlContent": html_body
            }
            
            headers = {
                "accept": "application/json",
                "api-key": self.api_key,
                "content-type": "application/json"
            }
            
            # Envia requisição para API Brevo
            async with httpx.AsyncClient(timeout=30.0) as client:
                self.logger.info(f"🌐 Chamando API Brevo: {self.api_url}")
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 201:
                    result = response.json()
                    self.logger.info(f"✅ Email enviado com sucesso!")
                    self.logger.info(f"   Message ID: {result.get('messageId')}")
                    return True
                else:
                    self.logger.error(f"❌ Erro da API Brevo: Status {response.status_code}")
                    self.logger.error(f"   Resposta: {response.text}")
                    return False
                    
        except httpx.TimeoutException:
            self.logger.error(f"❌ Timeout ao chamar API Brevo")
            return False
        except httpx.RequestError as e:
            self.logger.error(f"❌ Erro de rede ao chamar API Brevo: {e}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Erro inesperado ao enviar email: {type(e).__name__} - {e}")
            return False
