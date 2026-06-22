from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.models.user import User
from movie_backend.schemas.auth_schema import (
    SignupRequest,
    LoginRequest
)
from movie_backend.util.helpers import (
    hash_password,
    verify_password,
    create_access_token
)


async def signup_service(
    request: SignupRequest,
    db: AsyncSession
):
    statement = select(User).where(
        User.email == request.email
    )

    result = await db.execute(statement)

    user = result.scalar_one_or_none()

    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    new_user = User(
        username=request.name,
        email=request.email,
        hashed_password=hash_password(request.password)
    )

    db.add(new_user)

    await db.commit()

    await db.refresh(new_user)

    return {
        "name": new_user.username,
        "email": new_user.email
    }


async def login_service(
    request: LoginRequest,
    db: AsyncSession
):
    statement = select(User).where(
        User.email == request.email
    )

    result = await db.execute(statement)

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incorrect password or email or not registered"
        )

    if not verify_password(
        request.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password or email"
        )

    token = create_access_token(
        {
            "id": user.id,
            "email": user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


async def logout_service(
    current_user
):
    return {
        "message": "Logout successful"
    }


async def get_current_user_service(
    current_user,
    db: AsyncSession
):
    statement = select(User).where(
        User.id == current_user["id"]
    )

    result = await db.execute(statement)

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "name": user.username,
        "email": user.email
    }