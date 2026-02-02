from typing import final
from pydantic import Field
from pydantic_settings import BaseSettings


def _to_async_pg_url(url: str) -> str:
    """Converte URL postgresql:// para postgresql+asyncpg:// (uso com SQLAlchemy async)."""
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    return url


@final
class DatabaseSettings(BaseSettings):
    """
    Database configuration: SQLite (dev), MySQL ou PostgreSQL (Supabase).
    Prioridade: DATABASE_URL (Supabase) > USE_SQLITE > MySQL.
    """

    # SQLite
    sqlite_db_path: str = Field(default="./hr.db", alias="SQLITE_DB_PATH")
    use_sqlite: bool = Field(default=True, alias="USE_SQLITE")

    # MySQL
    mysql_user: str = Field(default="", alias="MYSQL_USER")
    mysql_password: str = Field(default="", alias="MYSQL_PASSWORD")
    mysql_server: str = Field(default="localhost", alias="MYSQL_SERVER")
    mysql_port: int = Field(default=3306, alias="MYSQL_PORT")
    mysql_db: str = Field(default="", alias="MYSQL_DB")

    # PostgreSQL / Supabase: connection string (ex.: Supabase Project Settings > Database)
    database_url_raw: str | None = Field(default=None, alias="DATABASE_URL")
    postgres_user: str = Field(default="postgres", alias="POSTGRES_USER")
    postgres_password: str = Field(default="", alias="POSTGRES_PASSWORD")
    postgres_server: str = Field(default="localhost", alias="POSTGRES_SERVER")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="postgres", alias="POSTGRES_DB")

    def _resolve_url(self) -> str:
        if self.database_url_raw and self.database_url_raw.strip():
            return self.database_url_raw.strip()
        if self.use_sqlite:
            return f"sqlite+aiosqlite:///{self.sqlite_db_path}"
        return (
            f"mysql+aiomysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_server}:{self.mysql_port}/{self.mysql_db}"
        )

    @property
    def database_url(self) -> str:
        """
        URL para SQLAlchemy async (engine/sessions).
        Se DATABASE_URL for postgresql:// (Supabase), converte para postgresql+asyncpg://.
        """
        url = self._resolve_url()
        if "postgresql" in url or url.startswith("postgres://"):
            return _to_async_pg_url(url)
        return url

    @property
    def sqlalchemy_database_uri(self) -> str:
        return self.database_url

    def database_display(self) -> str:
        """
        Retorna uma string segura para log/terminal (senha mascarada).
        Ex.: "SQLite @ ./hr.db" ou "PostgreSQL @ host:6543/postgres"
        """
        if self.database_url_raw and self.database_url_raw.strip():
            url = self.database_url_raw.strip()
            # Mascarar senha e extrair host/porta/db para exibição
            if "postgresql" in url or url.startswith("postgres://"):
                try:
                    # Formato: postgresql://user:PASS@host:port/db
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    netloc = parsed.netloc
                    if "@" in netloc:
                        host_port = netloc.rsplit("@", 1)[-1]
                    else:
                        host_port = netloc
                    db = (parsed.path or "/postgres").strip("/") or "postgres"
                    return f"PostgreSQL (Supabase) @ {host_port}/{db}"
                except Exception:
                    return "PostgreSQL (Supabase) @ [DATABASE_URL configurada]"
            return "PostgreSQL @ [DATABASE_URL]"
        if self.use_sqlite:
            return f"SQLite @ {self.sqlite_db_path}"
        return (
            f"MySQL @ {self.mysql_server}:{self.mysql_port}/{self.mysql_db}"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
