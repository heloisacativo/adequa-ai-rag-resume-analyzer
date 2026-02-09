from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from application.use_cases.users.request_email_verification import RequestEmailVerificationUseCase
from application.use_cases.users.verify_email_code import VerifyEmailCodeUseCase

router = APIRouter(prefix="/users", tags=["Email Verification"])


class RequestVerificationRequest(BaseModel):
    email: EmailStr
    full_name: str


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerificationResponse(BaseModel):
    success: bool
    message: str
    data: dict | None = None


@router.post("/request-email-verification", response_model=VerificationResponse)
@inject
async def request_verification(
    request: RequestVerificationRequest,
    use_case: FromDishka[RequestEmailVerificationUseCase],
):
    """Solicita código de verificação por email."""
    try:
        result = await use_case(request.email, request.full_name)
        return VerificationResponse(
            success=True,
            message="Código enviado com sucesso",
            data={
                "email": result.email,
                "expires_at": result.expires_at.isoformat() if result.expires_at else None,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/verify-email-code", response_model=VerificationResponse)
@inject
async def verify_email(
    request: VerifyCodeRequest,
    use_case: FromDishka[VerifyEmailCodeUseCase],
):
    """Verifica o código de email."""
    try:
        await use_case(request.email, request.code)
        return VerificationResponse(
            success=True,
            message="Email verificado com sucesso"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))