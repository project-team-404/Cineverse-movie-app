import json

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

from movie_backend.util.emails import (
    send_welcome_email,
    send_otp_email,
    generate_otp
)

from movie_backend.util.helpers import rate_limit,redis_client

import uuid

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


    send_welcome_email(new_user.username, new_user.email)


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


async def get_otp_service(
    request,
    db: AsyncSession
):
    result = await db.execute(
        select(User).where(User.email == request.email)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found."
        )

    otp = generate_otp()
    request_id = str(uuid.uuid4())

    await redis_client.setex(
        f"forgot:{request_id}",
        300,
        json.dumps({
            "email": user.email,
            "otp": otp,
            "verified": False
        })
    )

    send_otp_email(user.email, otp)

    return {
        "message": "Check your email for the OTP.",
        "request_id": request_id
    }


async def get_otp_verified_service(
    request
):
    key = f"forgot:{request.request_id}"

    data = await redis_client.get(key)

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or invalid request."
        )

    data = json.loads(data)

    if data["verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP already verified."
        )

    if data["otp"] != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP."
        )

    data["verified"] = True

    ttl = await redis_client .ttl(key)

    await redis_client.setex(
        key,
        ttl,
        json.dumps(data)
    )

    return {
        "message": "OTP verified successfully.",
        "request_id": request.request_id
    }


async def reset_password_service(
    request,
    db: AsyncSession
):
    key = f"forgot:{request.request_id}"

    data = await redis_client.get(key)

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request expired."
        )

    data = json.loads(data)

    if not data["verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP not verified."
        )

    result = await db.execute(
        select(User).where(User.email == data["email"])
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if verify_password(
        request.new_password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the old password."
        )

    user.hashed_password = hash_password(
        request.new_password
    )

    await db.commit()
    await db.refresh(user)

    await redis_client .delete(key)

    return {
        "message": "Password reset successfully."
    }