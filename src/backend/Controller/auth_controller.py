from fastapi import APIRouter, Depends, Response, Request, Query
from sqlalchemy.orm import Session
from Service.auth_service import AuthService
from database import get_db
from Repository.user_repository import UserRepository
from Domain.models.user import UserModel
from utils.auth_dephs import require_role

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    repo = UserRepository(db)
    return AuthService(repo)

@router.post("/register")
async def register(data: dict, response: Response, service: AuthService = Depends(get_auth_service)):
    return await service.register_user(data, response)

@router.post("/login")
async def login(data: dict, response: Response, service: AuthService = Depends(get_auth_service)):
    return await service.login_user(data, response)

@router.post("/logout")
async def logout(request: Request, response: Response, service: AuthService = Depends(get_auth_service)):
    return await service.logout_user(request, response)

@router.put("/change-picture")
async def change_picture(data:dict, user_id : int = Query(...), service: AuthService = Depends(get_auth_service)):
    return await service.update_user_image(data,user_id)

@router.post("/forgot-password")
async def forgot_password(data: dict, service: AuthService = Depends(get_auth_service)):
    return await service.process_forgot_password(data)

@router.post("/reset-password")
async def reset_password(data: dict, service: AuthService = Depends(get_auth_service)):
    return await service.process_reset_password(data)
