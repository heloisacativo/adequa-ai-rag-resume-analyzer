from typing import final

from pydantic import Field
from pydantic_settings import BaseSettings


@final
class ExternalAPISettings(BaseSettings):
    """
    External API configuration settings.

    Attributes:
        museum_api_base (str): Base URL for the external museum API.
        catalog_api_base (str): Base URL for the public catalog API.
        external_api_base_url (str): Alias for museum_api_base.
        catalog_api_base_url (str): Alias for catalog_api_base.
        http_timeout (float): HTTP request timeout in seconds.
        smtp_server (str): SMTP server address.
        smtp_port (int): SMTP port.
        email_sender (str): Email sender address.
        email_password (str): Email password.
    """

    museum_api_base: str = Field(
        "https://api.antiquarium-museum.ru", alias="MUSEUM_API_BASE"
    )
    catalog_api_base: str = Field(
        "https://catalog.antiquarium-museum.ru", alias="CATALOG_API_BASE"
    )

    # Aliases for compatibility
    external_api_base_url: str = Field(
        "https://api.antiquarium-museum.ru", alias="EXTERNAL_API_BASE_URL"
    )
    catalog_api_base_url: str = Field(
        "https://catalog.antiquarium-museum.ru", alias="CATALOG_API_BASE_URL"
    )

    http_timeout: float = Field(10.0, alias="HTTP_TIMEOUT")
    smtp_server: str = Field(default="smtp.gmail.com", env="SMTP_SERVER")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_user: str = Field(default="", env="SMTP_USER")
    email_sender: str = Field(default="", env="EMAIL_SENDER")
    email_password: str = Field(default="", env="EMAIL_PASSWORD")
    brevo_api_key: str = Field(default="", env="BREVO_API_KEY")  

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
