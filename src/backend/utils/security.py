import os
import json
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import redis
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "SUPER_SECRET_MAKI_KEY_FOR_LOCAL_LAN_DEMO"
ALGORITHM = "HS256"
SESSION_EXPIRY_MINUTES = 30
RESET_EXPIRY_MINUTES = 15

REDIS_URL = os.environ.get("REDIS_URL")
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=SESSION_EXPIRY_MINUTES)
    to_encode.update({"exp": expire, "purpose": "session"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=RESET_EXPIRY_MINUTES)
    payload = {"sub": username, "purpose": "password_reset", "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)