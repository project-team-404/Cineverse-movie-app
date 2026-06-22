from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.schemas.auth_schema import (
    SignupRequest,
    LoginRequest
)


async def signup_service(
    request: SignupRequest,
    db: AsyncSession
):
    pass


async def login_service(
    request: LoginRequest,
    db: AsyncSession
):
    pass


async def logout_service(
    current_user
):
    pass


async def get_current_user_service(
    current_user,
    db: AsyncSession
):
    pass