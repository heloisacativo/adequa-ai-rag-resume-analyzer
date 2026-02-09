from datetime import datetime, timedelta
import jwt

class TokenGenerator:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def generate_token(self, user_id: str, user_type: str) -> str:
        payload = {
            "user_id": user_id,
            "user_type": user_type,
            "exp": datetime.utcnow() + timedelta(hours=1),  
        }
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token