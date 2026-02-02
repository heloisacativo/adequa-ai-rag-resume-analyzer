import os

import jwt
from datetime import datetime, timedelta

from application.interfaces.security import TokenGeneratorProtocol

def _get_secret_key() -> str:
    key = os.getenv("JWT_SECRET_KEY", "") or os.getenv("SECRET_KEY", "")
    if not key:
        raise ValueError(
            "JWT_SECRET_KEY ou SECRET_KEY deve ser definida no .env para autenticação. "
            "Exemplo: JWT_SECRET_KEY=sua-chave-secreta-forte"
        )
    return key


ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

class TokenGenerator(TokenGeneratorProtocol):
    
    # 1. Adicionado o argumento user_type na assinatura
    def generate_token(self, user_id: str, user_type: str) -> str:
        secret_key = _get_secret_key()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 2. Adicionado o user_type ao dicionário (payload) do JWT
        to_encode = {
            "sub": user_id, 
            "type": user_type, # <--- Agora o tipo vai dentro do token
            "exp": expire
        }
        
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
        return encoded_jwt

    # 3. Renomeado de verify_token para decode_token para bater com o Protocolo
    def decode_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return {}