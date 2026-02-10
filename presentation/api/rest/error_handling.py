from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from application.exceptions import (
    ArtifactNotFoundError,
    BusinessRuleViolationError,
    FailedFetchArtifactMuseumAPIException,
    FailedPublishArtifactMessageBrokerException,
)
from domain.exceptions import (
    DomainValidationError,
    InvalidEraException,
    InvalidMaterialException,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserInactiveError,
    InvalidEmailException,
)


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ArtifactNotFoundError)
    async def artifact_not_found_exception_handler(
        request: Request,
        exc: ArtifactNotFoundError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": str(exc)},
        )

    @app.exception_handler(FailedFetchArtifactMuseumAPIException)
    async def failed_fetch_artifact_museum_api_exception_handler(
        request: Request,
        exc: FailedFetchArtifactMuseumAPIException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(exc)},
        )

    @app.exception_handler(FailedPublishArtifactMessageBrokerException)
    async def failed_publish_artifact_message_broker_exception_handler(
        request: Request,
        exc: FailedPublishArtifactMessageBrokerException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(exc)},
        )

    @app.exception_handler(DomainValidationError)
    async def domain_validation_error_handler(
        request: Request,
        exc: DomainValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": str(exc)},
        )

    @app.exception_handler(InvalidEraException)
    async def invalid_era_exception_handler(
        request: Request,
        exc: InvalidEraException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": str(exc)},
        )

    @app.exception_handler(BusinessRuleViolationError)
    async def business_rule_violation_error_handler(
        request: Request,
        exc: BusinessRuleViolationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": str(exc)},
        )

    @app.exception_handler(UserAlreadyExistsError)
    async def user_already_exists_error_handler(
        request: Request,
        exc: UserAlreadyExistsError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Não é possível utilizar este email. Tente fazer login ou use outro email."},
        )

    @app.exception_handler(InvalidCredentialsError)
    async def invalid_credentials_error_handler(
        request: Request,
        exc: InvalidCredentialsError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Email ou senha incorretos."},
        )

    @app.exception_handler(UserInactiveError)
    async def user_inactive_error_handler(
        request: Request,
        exc: UserInactiveError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Sua conta está inativa. Entre em contato com o suporte."},
        )

    @app.exception_handler(InvalidEmailException)
    async def invalid_email_exception_handler(
        request: Request,
        exc: InvalidEmailException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )
