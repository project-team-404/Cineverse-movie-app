from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.schemas.auth_schema import (
    SignupRequest,
    SignupResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    UserResponse
)
from movie_backend.services.auth_service import (
    signup_service,
    login_service,
    logout_service,
    get_current_user_service
)
from movie_backend.util.helpers import verify_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=SignupResponse)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    return await signup_service(request, db)


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    return await login_service(request, db)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_user=Depends(verify_token)
):
    return await logout_service(current_user)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user=Depends(verify_token),
    db: AsyncSession = Depends(get_db)
):
    return await get_current_user_service(current_user, db)