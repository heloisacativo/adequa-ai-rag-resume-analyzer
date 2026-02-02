from dishka import Provider, Scope, provide

from config.ioc.providers import (
    CacheProvider,
    DatabaseProvider,
    MapperProvider,
    RepositoryProvider,
    SecurityProvider,
    SettingsProvider,
    UseCaseProvider,
    UnitOfWorkProvider,
    ServiceProvider,
    AIProvider,
    ResumeUseCaseProvider,
    JobUseCaseProvider,
    AISettingsProvider,  # <--- adicione aqui
)
from application.use_cases.users.register_user import RegisterUserUseCase


def get_providers() -> list[Provider]:
    providers = []

    for ProviderClass in [
        SettingsProvider,
        DatabaseProvider,
        RepositoryProvider,
        MapperProvider,
        CacheProvider,
        UseCaseProvider,
        UnitOfWorkProvider,
        SecurityProvider,
        ServiceProvider,
        AIProvider,
        ResumeUseCaseProvider,
        JobUseCaseProvider,
        AISettingsProvider,  # <--- adicione aqui
    ]:
        result = ProviderClass()
        if isinstance(result, list):
            providers.extend(result)
        else:
            providers.append(result)

    return providers

