from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from config import JWT_SECRET, JWT_EXPIRE_HOURS

ALGORITHM = "HS256"


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    """Returns user_id string or None if token is invalid/expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None