from fastapi import HTTPException, status, Response, Request
from Repository.user_repository import UserRepository
from Domain.models.user import UserModel
from utils.security import (
    hash_password, verify_password, create_access_token,
    create_reset_token, redis_client, SECRET_KEY, ALGORITHM
)
import json
import jwt

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register_user(self, data : dict, response : Response) -> dict:
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password are required")

        if self.user_repo.get_by_username(username):
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed_password = hash_password(password)
        new_user = UserModel(
            username=username,
            password=hashed_password,
            role="user",
            image = "null",
        )

        self.user_repo.create(new_user)

        return await self._generate_session_response(new_user, response)

    async def login_user(self, data: dict, response: Response) -> dict:
        user = self.user_repo.get_by_username(data.get("username"))
        if not user or not verify_password(data.get("password"), user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return await self._generate_session_response(user, response)

    async def logout_user(self, request: Request, response: Response) -> dict:
        token = request.cookies.get("access_token")
        if token:
            redis_client.delete(f"session:{token}")
        response.delete_cookie(key="access_token", httponly=True, secure=True, samesite="none")
        return {"message": "Logged out successfully"}

    async def process_forgot_password(self, data: dict) -> dict:
        username = data.get("username")
        if not username:
            raise HTTPException(status_code=400, detail="Username required")

        user = self.user_repo.get_by_username(username)

        if not user:
            raise HTTPException(status_code=400, detail="Processing error: Operation failed")

        token = create_reset_token(username)
        redis_client.setex(f"reset:{token}", 15 * 60, "unused")

        return {"message": "Reset sequence initialized", "token": token}

    async def process_reset_password(self, data: dict) -> dict:
        token = data.get("token")
        new_password = data.get("new_password")

        if not token or not new_password:
            raise HTTPException(status_code=400, detail="Missing required reset parameters")

        status_marker = redis_client.get(f"reset:{token}")
        if not status_marker:
            raise HTTPException(status_code=400, detail="Reset token has expired")
        if status_marker == "used":
            raise HTTPException(status_code=400, detail="Reset token has already been consumed")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("purpose") != "password_reset":
                raise HTTPException(status_code=400, detail="Invalid token scope")

            username = payload.get("sub")
            user = self.user_repo.get_by_username(username)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Apply updates across core database model structures
            user.password = hash_password(new_password)
            self.user_repo.update(user)

            # Invalidate the consumed token immediately inside Redis
            redis_client.setex(f"reset:{token}", 15 * 60, "used")
            return {"message": "Password updated successfully"}

        except jwt.PyJWTError:
            raise HTTPException(status_code=400, detail="Invalid or altered reset token")

    async def update_user_image(self, data: dict, user_id: int) -> dict:
        image = data.get("image")
        if not image:
            raise HTTPException(status_code=400, detail="Image URL is required")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.image = image
        self.user_repo.update(user)
        return {"message": "Image updated successfully", "image": user.image}

    async def _generate_session_response(self, user: UserModel, response: Response) -> dict:
        token_payload = {"id": user.id, "username": user.username, "role": user.role}
        token = create_access_token(token_payload)

        # Bind token persistence parameters down into Redis memory caches
        redis_client.setex(f"session:{token}", 30 * 60, json.dumps(token_payload))

        # Mount down into secure browser cookies to shield from cross-site scripting vulnerabilities
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=30 * 60
        )
        return {"id": user.id, "username": user.username, "role": user.role, "image": user.image}