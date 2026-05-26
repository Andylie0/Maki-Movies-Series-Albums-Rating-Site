import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL=os.environ.get("REDIS_URL")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("Connected to Cloud Redis!")
except Exception as e:
    print(f"Connection Failed: {e}")


def get_redis():
    return redis_client