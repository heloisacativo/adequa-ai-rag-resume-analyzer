import os
from typing import Annotated
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Carregado do .env - deve ser o mesmo valor usado no TokenGenerator
def _get_secret_key() -> str:
    key = os.getenv("JWT_SECRET_KEY", "") or os.getenv("SECRET_KEY", "")
    if not key:
        raise ValueError(
            "JWT_SECRET_KEY ou SECRET_KEY deve ser definida no .env. "
            "Exemplo: JWT_SECRET_KEY=sua-chave-secreta-forte"
        )
    return key

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Define onde o Swagger UI vai tentar buscar o token se o usuário não estiver logado
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")

@dataclass
class CurrentUser:
    """Classe simples para representar o usuário logado no request."""
    id: str
    type: str

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> CurrentUser:
    """
    Dependência do FastAPI para validar o token JWT e retornar os dados do usuário.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodifica o token usando a mesma chave secreta
        payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
        
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type") # Lembra que adicionamos 'type' no gerador?

        if user_id is None:
            raise credentials_exception
        
        # Retorna um objeto que tem o atributo .id (usado nos seus controllers)
        return CurrentUser(id=user_id, type=user_type)

    except jwt.InvalidTokenError:
        raise credentials_exception