from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, status
from dataclasses import asdict

from application.dtos.users.user import CreateUserDTO, LoginDTO
from application.interfaces.security import TokenGeneratorProtocol
from application.use_cases.login_user import LoginUserUseCase
from application.use_cases.users.register_user import RegisterUserUseCase
from application.mappers.users.user_mapper import UserMapper
from presentation.api.rest.v1.schemas.requests import LoginRequest, RegisterUserRequest
from presentation.api.rest.v1.schemas.responses import AuthTokenResponseSchema, UserResponseSchema

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=AuthTokenResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@inject
async def register_user(
    request: RegisterUserRequest,
    use_case: FromDishka[RegisterUserUseCase] = None,
    mapper: FromDishka[UserMapper] = None,
    token_generator: FromDishka[TokenGeneratorProtocol] = None,
) -> AuthTokenResponseSchema:
    dto = CreateUserDTO(
        email=request.email,
        full_name=request.full_name,
        plain_password=request.password,
        is_hirer=request.is_hirer,
    )
    user_dto = await use_case(dto)
    user_type = "hirer" if user_dto.is_hirer else "candidate"
    access_token = token_generator.generate_token(
        user_id=str(user_dto.user_id),
        user_type=user_type,
    )

    user_dict = asdict(user_dto)
    user_response = UserResponseSchema.model_validate(user_dict)

    return AuthTokenResponseSchema(
        access_token=access_token,
        user=user_response
    )

@router.post(
    "/login",
    response_model=AuthTokenResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Login a user",
)
@inject
async def login_user(
    request: LoginRequest,
    use_case: FromDishka[LoginUserUseCase] = None,
    mapper: FromDishka[UserMapper] = None,
) -> AuthTokenResponseSchema:
    dto = LoginDTO(
        email=request.email,
        plain_password=request.password,
    )
    auth_token_dto = await use_case(dto)

    # Converta o campo email para string antes de montar o schema de resposta
    user_dict = asdict(auth_token_dto.user)
    user_dict["email"] = str(user_dict["email"])
    user_response = UserResponseSchema.model_validate(user_dict)

    return AuthTokenResponseSchema(
        access_token=auth_token_dto.access_token,
        user=user_response
    )

