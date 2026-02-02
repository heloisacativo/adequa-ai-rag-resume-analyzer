"""Alembic environment configuration for MySQL async."""

import asyncio
import os
import sys  # ✅ Adicionar
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ✅ ADICIONAR: Adiciona o diretório raiz ao sys.path
root_path = Path(__file__).parents[3]  # migrations -> db -> infrastructures -> hr
sys.path.insert(0, str(root_path))

# Carrega o arquivo .env
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

# Import your models here
from infrastructures.db.models.users.user import mapper_registry
from infrastructures.db.models.chat import ChatSessionModel, ChatMessageModel
from infrastructures.db.models.resumes.resume import ResumeModel
from infrastructures.db.models.jobs.job import JobModel
from infrastructures.db.models.candidates.job_application import JobApplicationModel

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from sqlalchemy import MetaData

# Use the metadata from the shared registry
target_metadata = mapper_registry.metadata


def _to_async_pg_url(url: str) -> str:
    """Converte postgresql:// para postgresql+asyncpg:// (Alembic usa engine async)."""
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    return url


def get_url() -> str:
    """Get database URL from environment variable or config."""
    # 1) Supabase / PostgreSQL: DATABASE_URL (connection string do Supabase)
    db_url = os.getenv("DATABASE_URL")
    if db_url and db_url.strip():
        return _to_async_pg_url(db_url.strip())

    # 2) SQLite (desenvolvimento local)
    use_sqlite = os.getenv("USE_SQLITE", "false").lower() == "true"
    if use_sqlite:
        sqlite_path = os.getenv("SQLITE_DB_PATH", "./hr.db")
        return f"sqlite+aiosqlite:///{sqlite_path}"

    # 3) MySQL
    user = os.getenv("MYSQL_USER", "root")
    password = os.getenv("MYSQL_PASSWORD", "")
    host = os.getenv("MYSQL_SERVER", "127.0.0.1")
    port = os.getenv("MYSQL_PORT", "3306")
    database = os.getenv("MYSQL_DB", "rh_system")
    return f"mysql+aiomysql://{user}:{password}@{host}:{port}/{database}"


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
