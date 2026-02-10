from collections.abc import AsyncIterator
from typing import Any, Optional

from dishka import Provider, Scope, provide
from httpx import AsyncClient
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
)

from application.interfaces.users.repositories import UserRepositoryProtocol
from application.interfaces.users.email_verification_repository import EmailVerificationRepositoryProtocol
from application.interfaces.email.email_service import EmailServiceProtocol
from application.interfaces.jobs.repositories import JobRepositoryProtocol
from application.interfaces.chat.repositories import ChatRepositoryProtocol
from application.interfaces.security import PasswordHasherProtocol, TokenGeneratorProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from application.mappers.users.user_mapper import UserMapper
from application.use_cases.users.register_user import RegisterUserUseCase
from application.use_cases.users.request_email_verification import RequestEmailVerificationUseCase
from application.use_cases.users.verify_email_code import VerifyEmailCodeUseCase
from application.use_cases.login_user import LoginUserUseCase
from application.use_cases.jobs.job import (
    CreateJobUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    UpdateJobUseCase,
    DeleteJobUseCase,
    UpdateJobStatusUseCase,
)
from application.services.users.auth import AuthenticationService
from application.services.chat.chat_service import ChatService
from application.services.users.user_service import UserServiceProtocol
from config.base import Settings  # sua classe de configuração

from infrastructures.cache.redis_client import RedisCacheClient
from infrastructures.db.mappers.users.user_db_mapper import UserDBMapper
from infrastructures.repositories.email_verification_repository import InMemoryEmailVerificationRepository
from infrastructures.http.brevo_api_email_service import BrevoAPIEmailService
from infrastructures.db.mappers.jobs.job_db_mapper import JobDBMapper
from infrastructures.db.repositories.users.user import UserRepositorySQLAlchemy
from infrastructures.db.repositories.jobs.job import JobRepositorySQLAlchemy
from infrastructures.repositories.chat_repository_sqlalchemy import ChatRepositorySqlAlchemy
from infrastructures.repositories.chat_repository_supabase import ChatRepositorySupabase
from infrastructures.repositories.job_application_repository_sqlalchemy import JobApplicationRepository
from infrastructures.db.session import create_engine, get_session_factory
from infrastructures.db.uow import UnitOfWorkSQLAlchemy
from application.interfaces.cache import CacheProtocol
from application.services.security.password_hasher import PasswordHasher
from application.services.security.token_generator import TokenGenerator

# ===== IMPORTS PARA AI/RAG =====
from llama_index.llms.groq import Groq
from llama_index.core import Settings as LlamaSettings
from llama_index.core.llms import LLM
from llama_index.core.embeddings import BaseEmbedding

from config.ai.ai import AISettings

class AISettingsProvider(Provider):
    @provide(scope=Scope.APP)
    def get_ai_settings(self) -> AISettings:
        return AISettings()

# Protocols/Interfaces
from application.interfaces.ai.indexer import IndexerProtocol
from application.interfaces.ai.chunker import ChunkerProtocol
from application.interfaces.ai.ingestor import IngestionProtocol
from application.interfaces.ai.analyzer import AIAnalyzerProtocol
from application.interfaces.ai.transformer import TransformerProtocol
from application.interfaces.ai.location_analyzer import LocationAnalyzerProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol
from application.interfaces.resumes.resume_group_repository import ResumeGroupRepositoryProtocol

# Implementações
from infrastructures.ai.llama_indexer import LlamaIndexer
from infrastructures.ai.chunking_service import create_chunking_pipeline
from infrastructures.ai.ingestion_service import DocumentIngestor
from infrastructures.ai.ollama_analyzer import OllamaAnalyzer
from infrastructures.ai.transformer import DocumentTransformer

# ===== IMPORTS PARA RESUMES =====
from application.use_cases.resumes.upload_resumes import UploadResumesUseCase
from application.use_cases.resumes.ensure_upload_user import EnsureResumeUploadUserUseCase
from application.use_cases.resumes.list_indexes import ListIndexesUseCase
from application.use_cases.resumes.list_resumes import ListResumesUseCase
from application.use_cases.resumes.delete_resume import DeleteResumeUseCase
from application.use_cases.resumes.list_resume_groups import ListResumeGroupsUseCase
from application.use_cases.resumes.create_resume_group import CreateResumeGroupUseCase
from application.use_cases.resumes.delete_resume_group import DeleteResumeGroupUseCase
from application.use_cases.resumes.list_resumes_by_group import ListResumesByGroupUseCase
from application.use_cases.resumes.set_group_resumes import SetGroupResumesUseCase
from application.use_cases.candidates.analyze_resume import AnalyzeResumeUseCase
from application.use_cases.candidates.analyze_stored_resume import AnalyzeStoredResumeUseCase
from application.use_cases.candidates.analyze import AnalyzeCandidatesUseCase
from application.use_cases.candidates.create_job_application import CreateJobApplicationUseCase
from application.use_cases.candidates.list_job_applications import ListJobApplicationsUseCase
from application.use_cases.candidates.update_job_application_status import UpdateJobApplicationStatusUseCase
from application.use_cases.candidates.delete_job_application import DeleteJobApplicationUseCase
from application.use_cases.candidates.list_job_applications import ListJobApplicationsUseCase
from application.use_cases.candidates.update_job_application_status import UpdateJobApplicationStatusUseCase
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from infrastructures.repositories.resume_repository_sqlalchemy import ResumeRepositorySqlAlchemy
from infrastructures.repositories.resume_group_repository_sqlalchemy import ResumeGroupRepositorySqlAlchemy
from infrastructures.db.models.candidates.job_application import JobApplicationModel  # Import to register the model
from infrastructures.db.models.resumes.resume_group import ResumeGroupModel, ResumeGroupMemberModel  # Register models


class SettingsProvider(Provider):
    """
    Provides application settings.
    """

    @provide(scope=Scope.APP)
    def get_settings(self) -> Settings:
        """
        Provides the Settings instance.
        """
        return Settings()


class DatabaseProvider(Provider):
    """
    Provides database-related dependencies, such as session factory and sessions.
    """

    @provide(scope=Scope.APP)
    async def get_session_factory(
        self, settings: Settings
    ) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
        """
        Provides an asynchronous session factory for SQLAlchemy.
        """
        engine = create_engine(str(settings.database_url), is_echo=settings.debug)
        session_factory = get_session_factory(engine)
        try:
            yield session_factory
        finally:
            await engine.dispose()

    @provide(scope=Scope.REQUEST)
    async def get_session(
        self, factory: async_sessionmaker[AsyncSession]
    ) -> AsyncIterator[AsyncSession]:
        """
        Provides an asynchronous SQLAlchemy session.
        """
        async with factory() as session:
            yield session


class ChatDatabaseProvider(Provider):
    """
    When CHAT_DATABASE_URL is set (e.g. Supabase), provides a session factory for chat.
    Histórico de conversas passa a ser salvo no Supabase em vez do SQLite/PythonAnywhere.
    """

    @provide(scope=Scope.APP)
    async def get_chat_session_factory(
        self, settings: Settings
    ) -> AsyncIterator[Optional[async_sessionmaker[AsyncSession]]]:
        url = settings.database.chat_database_url_async
        if not url:
            yield None
            return
        engine = create_engine(str(url), is_echo=settings.debug)
        session_factory = get_session_factory(engine)
        try:
            yield session_factory
        finally:
            await engine.dispose()


class RepositoryProvider(Provider):
    """
    Provides repository implementations.
    """

    @provide(scope=Scope.REQUEST)
    def get_user_repository(
        self, session: AsyncSession, db_mapper: UserDBMapper
    ) -> UserRepositoryProtocol:
        """
        Provides an UserRepositoryProtocol implementation.
        """
        return UserRepositorySQLAlchemy(session=session, mapper=db_mapper)

    @provide(scope=Scope.REQUEST)
    def get_job_repository(
        self, session: AsyncSession, db_mapper: JobDBMapper
    ) -> JobRepositoryProtocol:
        """
        Provides a JobRepositoryProtocol implementation.
        """
        return JobRepositorySQLAlchemy(session=session, mapper=db_mapper)

    @provide(scope=Scope.REQUEST)
    def get_chat_repository(
        self,
        session: AsyncSession,
        chat_session_factory: Optional[async_sessionmaker[AsyncSession]],
    ) -> ChatRepositoryProtocol:
        """
        Chat no Supabase quando CHAT_DATABASE_URL está definido; senão usa o banco principal (SQLite).
        """
        if chat_session_factory is not None:
            return ChatRepositorySupabase(session_factory=chat_session_factory)
        return ChatRepositorySqlAlchemy(session=session)
    
    @provide(scope=Scope.APP)
    def get_email_verification_repository(self) -> EmailVerificationRepositoryProtocol:
        """
        Provides an EmailVerificationRepositoryProtocol implementation (in-memory for now).
        """
        return InMemoryEmailVerificationRepository()
    
    @provide(scope=Scope.APP)
    def get_email_service(self, settings: Settings) -> EmailServiceProtocol:
        """
        Provides an EmailServiceProtocol implementation (Brevo API - compatível com Hugging Face Spaces).
        """
        return BrevoAPIEmailService(settings=settings.external_apis)


class UnitOfWorkProvider(Provider):
    """
    Provides Unit of Work implementations.
    """

    @provide(scope=Scope.REQUEST)
    def get_unit_of_work(
        self,
        session: AsyncSession,
        repository: UserRepositoryProtocol,
        resume_repository: ResumeRepositoryProtocol,
        job_repository: JobRepositoryProtocol,
        chat_repository: ChatRepositoryProtocol,
    ) -> UnitOfWorkProtocol:
        """
        Provides a UnitOfWorkProtocol implementation.
        """
        return UnitOfWorkSQLAlchemy(session=session, repository=repository, resume_repository=resume_repository, job_repository=job_repository, chat_repository=chat_repository)


class MapperProvider(Provider):
    """
    Provides various mapper implementations for different layers.
    """

    @provide(scope=Scope.APP)
    def get_user_mapper(self) -> UserMapper:
        """
        Provides the Application layer mapper (Domain Entity <-> Application DTO).
        """
        return UserMapper()

    @provide(scope=Scope.REQUEST)
    def get_db_mapper(self) -> UserDBMapper:
        """
        Provides the Database mapper (Domain Entity <-> SQLAlchemy Model).
        """
        return UserDBMapper()

    @provide(scope=Scope.REQUEST)
    def get_job_db_mapper(self) -> JobDBMapper:
        """
        Provides the Job Database mapper (Domain Entity <-> SQLAlchemy Model).
        """
        return JobDBMapper()


class CacheProvider(Provider):
    """
    Provides caching services using Redis.
    """

    @provide(scope=Scope.APP)
    async def get_cache_service(
        self, settings: Settings
    ) -> AsyncIterator[CacheProtocol]:
        """
        Provides a CacheProtocol implementation.
        """
        redis_client = await redis.from_url(
            str(settings.redis_url),
            encoding="utf-8",
            decode_responses=True,
            health_check_interval=30,
            max_connections=10,
            retry_on_timeout=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        cache_service = RedisCacheClient(
            client=redis_client, ttl=settings.redis_cache_ttl
        )
        try:
            yield cache_service
        finally:
            await cache_service.close()


class UseCaseProvider(Provider):
    """
    Provides application use cases.
    """

    @provide(scope=Scope.REQUEST)
    def get_register_user_use_case(
        self,
        uow: UnitOfWorkProtocol,
        repository: UserRepositoryProtocol,
        password_hasher: PasswordHasherProtocol,
        mapper: UserMapper,
    ) -> RegisterUserUseCase:
        """
        Provides a RegisterUserUseCase instance.
        """
        return RegisterUserUseCase(
            uow=uow,
            repository=repository,
            password_hasher=password_hasher,
            mapper=mapper,
        )

    @provide(scope=Scope.REQUEST)
    def get_login_user_use_case(
        self,
        uow: UnitOfWorkProtocol,
        repository: UserRepositoryProtocol,
        token_generator: TokenGeneratorProtocol,
        mapper: UserMapper,
        auth_service: AuthenticationService,
    ) -> LoginUserUseCase:
        """
        Provides a LoginUserUseCase instance.
        """
        return LoginUserUseCase(
            uow=uow,
            repository=repository,
            token_generator=token_generator,
            mapper=mapper,
            auth_service=auth_service,
        )
    
    @provide(scope=Scope.REQUEST)
    def get_request_email_verification_use_case(
        self,
        email_verification_repo: EmailVerificationRepositoryProtocol,
        email_service: EmailServiceProtocol,
    ) -> RequestEmailVerificationUseCase:
        """
        Provides a RequestEmailVerificationUseCase instance.
        """
        return RequestEmailVerificationUseCase(
            email_verification_repo=email_verification_repo,
            email_service=email_service,
        )
    
    @provide(scope=Scope.REQUEST)
    def get_verify_email_code_use_case(
        self,
        email_verification_repo: EmailVerificationRepositoryProtocol,
    ) -> VerifyEmailCodeUseCase:
        """
        Provides a VerifyEmailCodeUseCase instance.
        """
        return VerifyEmailCodeUseCase(
            email_verification_repo=email_verification_repo,
        )


class JobUseCaseProvider(Provider):
    """
    Provides job-related use cases.
    """

    @provide(scope=Scope.REQUEST)
    def get_create_job_use_case(
        self,
        repository: JobRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> CreateJobUseCase:
        """
        Provides a CreateJobUseCase instance.
        """
        return CreateJobUseCase(repository=repository, uow=uow)

    @provide(scope=Scope.REQUEST)
    def get_list_jobs_use_case(
        self,
        repository: JobRepositoryProtocol,
    ) -> ListJobsUseCase:
        """
        Provides a ListJobsUseCase instance.
        """
        return ListJobsUseCase(repository=repository)

    @provide(scope=Scope.REQUEST)
    def get_get_job_use_case(
        self,
        repository: JobRepositoryProtocol,
    ) -> GetJobUseCase:
        """
        Provides a GetJobUseCase instance.
        """
        return GetJobUseCase(repository=repository)

    @provide(scope=Scope.REQUEST)
    def get_update_job_use_case(
        self,
        repository: JobRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> UpdateJobUseCase:
        """
        Provides an UpdateJobUseCase instance.
        """
        return UpdateJobUseCase(repository=repository, uow=uow)

    @provide(scope=Scope.REQUEST)
    def get_delete_job_use_case(
        self,
        repository: JobRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> DeleteJobUseCase:
        """
        Provides a DeleteJobUseCase instance.
        """
        return DeleteJobUseCase(repository=repository, uow=uow)

    @provide(scope=Scope.REQUEST)
    def get_update_job_status_use_case(
        self,
        repository: JobRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> UpdateJobStatusUseCase:
        """
        Provides an UpdateJobStatusUseCase instance.
        """
        return UpdateJobStatusUseCase(repository=repository, uow=uow)


class SecurityProvider(Provider):
    """
    Provides security-related services, such as password hashing.
    """

    @provide(scope=Scope.APP)
    def get_password_hasher(self) -> PasswordHasherProtocol:
        """
        Provides a PasswordHasherProtocol implementation.
        """
        return PasswordHasher()

    @provide(scope=Scope.APP)
    def get_token_generator(self) -> TokenGeneratorProtocol:
        return TokenGenerator()  # ajuste conforme o construtor da sua implementação


class ServiceProvider(Provider):
    @provide(scope=Scope.REQUEST)
    def get_authentication_service(
        self,
        password_hasher: PasswordHasherProtocol,
    ) -> AuthenticationService:
        return AuthenticationService(
            password_hasher=password_hasher,
        )

    @provide(scope=Scope.REQUEST)
    def get_chat_service(
        self,
        chat_repository: ChatRepositoryProtocol,
    ) -> ChatService:
        return ChatService(
            chat_repository=chat_repository,
        )

    @provide(scope=Scope.REQUEST)
    def get_user_service(
        self,
        user_repository: UserRepositoryProtocol,
    ) -> "UserServiceProtocol":
        from application.services.users.user_service_impl import UserService
        return UserService(
            user_repository=user_repository,
        )


# ===== NOVOS PROVIDERS PARA IA E CURRÍCULOS =====

class AIProvider(Provider):
    """Providers para serviços de IA"""

    @provide(scope=Scope.APP)
    def get_llm(self) -> LLM:
        # Sempre retorna o LLM global (Groq ou Ollama, conforme setup_ai_services)
        return LlamaSettings.llm  # <--- usa LlamaSettings

    @provide(scope=Scope.APP)
    def get_embed_model(self) -> BaseEmbedding:
        # Sempre retorna o modelo de embedding global
        return LlamaSettings.embed_model  # <--- usa LlamaSettings

    @provide(scope=Scope.APP)
    def get_transformer(self) -> TransformerProtocol:
        return DocumentTransformer()

    @provide(scope=Scope.APP)
    def get_chunker(self, embed_model: BaseEmbedding) -> ChunkerProtocol:
        return create_chunking_pipeline(
            use_semantic=True,
            embed_model=embed_model
        )

    @provide(scope=Scope.APP)
    def get_ingestor(self, ai_settings: AISettings) -> IngestionProtocol:
        from pathlib import Path
        storage_path = Path(ai_settings.storage_dir)
        storage_path.mkdir(parents=True, exist_ok=True)
        return DocumentIngestor(storage_dir=storage_path)

    @provide(scope=Scope.APP)
    def get_indexer(
        self,
        embed_model: BaseEmbedding,
        ai_settings: AISettings,
        chunker: ChunkerProtocol,
        ingestor: IngestionProtocol
    ) -> IndexerProtocol:
        from pathlib import Path
        
        sqlite_storage = None
        
        if ai_settings.use_sqlite_storage:
            try:
                storage_url = ai_settings.sqlite_storage_url.strip()
                
                if storage_url.startswith(('http://', 'https://')):
                    from infrastructures.storage.sqlite_storage import HTTPFileStorageService
                    sqlite_storage = HTTPFileStorageService(storage_url)
                    print("=" * 60)
                    print("✅ Indexer: SQLite HTTP Storage (PythonAnywhere) CONFIGURADO")
                    print(f"   URL: {storage_url}")
                    print(f"   Índices serão salvos remotamente")
                    print("=" * 60)
                else:
                    from infrastructures.storage.sqlite_storage import SQLiteFileStorageService
                    sqlite_storage = SQLiteFileStorageService(storage_url)
                    print("=" * 60)
                    print("✅ Indexer: SQLite File Storage (Local) CONFIGURADO")
                    print(f"   Caminho: {storage_url}")
                    print("=" * 60)
            except Exception as e:
                print("=" * 60)
                print("❌ ERRO ao configurar SQLite storage para indexer")
                print(f"   Erro: {e}")
                print("   Usando armazenamento local como fallback")
                print("=" * 60)
        
        return LlamaIndexer(
            embed_model=embed_model,
            vector_store_dir=Path(ai_settings.vector_store_dir),
            chunker=chunker,
            ingestor=ingestor,
            sqlite_storage=sqlite_storage
        )

    @provide(scope=Scope.APP)
    def get_analyzer(self, llm: LLM) -> AIAnalyzerProtocol:
        return OllamaAnalyzer(llm=llm)
    
    @provide(scope=Scope.APP)
    def get_location_analyzer(self, llm: LLM) -> LocationAnalyzerProtocol:
        from infrastructures.ai.location_analyzer import LocationAnalyzer
        return LocationAnalyzer(llm=llm)


class ResumeUseCaseProvider(Provider):
    """Providers para casos de uso de currículos"""

    @provide(scope=Scope.REQUEST)
    def get_upload_use_case(
        self,
        indexer: IndexerProtocol,
        ai_settings: AISettings,
        resume_repository: ResumeRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> UploadResumesUseCase:
        from pathlib import Path

        storage_path = Path(ai_settings.storage_dir)
        s3_storage = None
        sqlite_storage = None
        
        # Configura SQLite se habilitado
        if ai_settings.use_sqlite_storage:
            try:
                storage_url = ai_settings.sqlite_storage_url.strip()
                
                if storage_url.startswith(('http://', 'https://')):
                    from infrastructures.storage.sqlite_storage import HTTPFileStorageService
                    sqlite_storage = HTTPFileStorageService(storage_url)
                    print("=" * 60)
                    print("✅ SQLite HTTP Storage (PythonAnywhere) CONFIGURADO")
                    print(f"   URL: {storage_url}")
                    print("=" * 60)
                else:
                    from infrastructures.storage.sqlite_storage import SQLiteFileStorageService
                    sqlite_storage = SQLiteFileStorageService(storage_url)
                    print("=" * 60)
                    print("✅ SQLite File Storage (Local) CONFIGURADO")
                    print(f"   Caminho: {storage_url}")
                    print("=" * 60)
            except Exception as e:
                print("=" * 60)
                print("❌ ERRO ao configurar SQLite storage")
                print(f"   Erro: {e}")
                print("   Usando armazenamento local como fallback")
                print("=" * 60)
        
        elif ai_settings.use_s3_storage:
            try:
                from infrastructures.storage.s3_storage import S3StorageService
                s3_storage = S3StorageService(
                    endpoint_url=ai_settings.s3_endpoint_url,
                    region=ai_settings.s3_region,
                    access_key=ai_settings.s3_access_key,
                    secret_key=ai_settings.s3_secret_key,
                    bucket_name=ai_settings.s3_bucket_name,
                    folder_prefix=ai_settings.s3_folder_prefix
                )
            except Exception as e:
                print(f"Erro ao configurar S3, usando armazenamento local: {e}")
        
        if not sqlite_storage and not s3_storage:
            storage_path.mkdir(parents=True, exist_ok=True)
        
        return UploadResumesUseCase(
            uow=uow,
            repository=resume_repository,
            indexer=indexer,
            storage_dir=storage_path,
            s3_storage=s3_storage,
            sqlite_storage=sqlite_storage
        )

    @provide(scope=Scope.REQUEST)
    def get_ensure_resume_upload_user_use_case(
        self,
        uow: UnitOfWorkProtocol,
        user_repository: UserRepositoryProtocol,
        password_hasher: PasswordHasherProtocol,
    ) -> EnsureResumeUploadUserUseCase:
        return EnsureResumeUploadUserUseCase(
            uow=uow,
            repository=user_repository,
            password_hasher=password_hasher,
        )

    @provide(scope=Scope.REQUEST)
    def get_analyze_resume_use_case(
        self,
        repository: JobApplicationRepositoryProtocol,
        ingestor: IngestionProtocol,
        chunker: ChunkerProtocol,
        analyzer: AIAnalyzerProtocol,
    ) -> AnalyzeResumeUseCase:
        return AnalyzeResumeUseCase(
            repository=repository,
            ingestor=ingestor,
            chunker=chunker,
            analyzer=analyzer,
        )
    
    @provide(scope=Scope.REQUEST)
    def get_resume_repository(self, session: AsyncSession) -> ResumeRepositoryProtocol:
        return ResumeRepositorySqlAlchemy(session=session)
    
    @provide(scope=Scope.REQUEST)
    def get_list_indexes_use_case(
        self,
        repository: ResumeRepositoryProtocol,
    ) -> ListIndexesUseCase:
        return ListIndexesUseCase(repository=repository)
    
    @provide(scope=Scope.REQUEST)
    def get_list_resumes_use_case(
        self,
        repository: ResumeRepositoryProtocol,
    ) -> ListResumesUseCase:
        return ListResumesUseCase(repository=repository)
    
    @provide(scope=Scope.REQUEST)
    def get_delete_resume_use_case(
        self,
        repository: ResumeRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> DeleteResumeUseCase:
        return DeleteResumeUseCase(repository=repository, uow=uow)

    @provide(scope=Scope.REQUEST)
    def get_resume_group_repository(self, session: AsyncSession) -> ResumeGroupRepositoryProtocol:
        return ResumeGroupRepositorySqlAlchemy(session=session)

    @provide(scope=Scope.REQUEST)
    def get_list_resume_groups_use_case(
        self,
        repository: ResumeGroupRepositoryProtocol,
    ) -> ListResumeGroupsUseCase:
        return ListResumeGroupsUseCase(repository=repository)

    @provide(scope=Scope.REQUEST)
    def get_create_resume_group_use_case(
        self,
        repository: ResumeGroupRepositoryProtocol,
    ) -> CreateResumeGroupUseCase:
        return CreateResumeGroupUseCase(repository=repository)

    @provide(scope=Scope.REQUEST)
    def get_delete_resume_group_use_case(
        self,
        repository: ResumeGroupRepositoryProtocol,
    ) -> DeleteResumeGroupUseCase:
        return DeleteResumeGroupUseCase(repository=repository)

    @provide(scope=Scope.REQUEST)
    def get_list_resumes_by_group_use_case(
        self,
        group_repository: ResumeGroupRepositoryProtocol,
        resume_repository: ResumeRepositoryProtocol,
    ) -> ListResumesByGroupUseCase:
        return ListResumesByGroupUseCase(group_repository=group_repository, resume_repository=resume_repository)

    @provide(scope=Scope.REQUEST)
    def get_set_group_resumes_use_case(
        self,
        repository: ResumeGroupRepositoryProtocol,
    ) -> SetGroupResumesUseCase:
        return SetGroupResumesUseCase(repository=repository)

    @provide(scope=Scope.REQUEST)
    def get_job_application_repository(self, session: AsyncSession) -> JobApplicationRepositoryProtocol:
        return JobApplicationRepository(session=session)
    
    @provide(scope=Scope.REQUEST)
    def get_create_job_application_use_case(
        self,
        repository: JobApplicationRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> CreateJobApplicationUseCase:
        return CreateJobApplicationUseCase(repository=repository, uow=uow)
    
    @provide(scope=Scope.REQUEST)
    def get_list_job_applications_use_case(
        self,
        repository: JobApplicationRepositoryProtocol,
    ) -> ListJobApplicationsUseCase:
        return ListJobApplicationsUseCase(repository=repository)
    
    @provide(scope=Scope.REQUEST)
    def get_update_job_application_status_use_case(
        self,
        repository: JobApplicationRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> UpdateJobApplicationStatusUseCase:
        return UpdateJobApplicationStatusUseCase(repository=repository, uow=uow)
    
    @provide(scope=Scope.REQUEST)
    def get_delete_job_application_use_case(
        self,
        repository: JobApplicationRepositoryProtocol,
        uow: UnitOfWorkProtocol,
    ) -> DeleteJobApplicationUseCase:
        return DeleteJobApplicationUseCase(repository=repository, uow=uow)
    
    @provide(scope=Scope.REQUEST)
    def get_analyze_resume_use_case(
        self,
        repository: JobApplicationRepositoryProtocol,
        ingestor: IngestionProtocol,
        chunker: ChunkerProtocol,
        analyzer: AIAnalyzerProtocol,
    ) -> AnalyzeResumeUseCase:
        return AnalyzeResumeUseCase(
            repository=repository,
            ingestor=ingestor,
            chunker=chunker,
            analyzer=analyzer,
        )
    
    @provide(scope=Scope.REQUEST)
    def get_analyze_stored_resume_use_case(
        self,
        job_repository: JobApplicationRepositoryProtocol,
        resume_repository: ResumeRepositoryProtocol,
        indexer: IndexerProtocol,
        analyzer: AIAnalyzerProtocol,
    ) -> AnalyzeStoredResumeUseCase:
        return AnalyzeStoredResumeUseCase(
            job_repository=job_repository,
            resume_repository=resume_repository,
            indexer=indexer,
            analyzer=analyzer,
        )
    
    @provide(scope=Scope.REQUEST)
    def get_analyze_candidates_use_case(
        self,
        indexer: IndexerProtocol,
        location_analyzer: LocationAnalyzerProtocol,
    ) -> AnalyzeCandidatesUseCase:
        return AnalyzeCandidatesUseCase(
            indexer=indexer,
            location_analyzer=location_analyzer,
        )
