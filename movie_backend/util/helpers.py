from fastapi import (
    Header,
    HTTPException,
    UploadFile,
    Request
)
from sqlalchemy.ext.asyncio import AsyncSession
from movie_backend.models.user import User
from sqlalchemy import select

import redis.asyncio as redis

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from dotenv import load_dotenv

from uuid import uuid4
import uuid
import os

UPLOAD_DIR = "uploads/profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))


redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(
        password: str
) -> str:
    return pwd_context.hash(password)


def verify_password(
        plain_password: str,
        hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
        data: dict,
        expires_delta: timedelta | None = None
):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = (
            datetime.utcnow()
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update(
        {
            "exp": expire
        }
    )

    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


def verify_token(
        authorization: str = Header(...)
):
    print(
        "Authorization Header:",
        authorization
    )

    try:
        scheme, token = authorization.split()

        print(
            "Scheme:",
            scheme
        )

        print(
            "Token:",
            token
        )

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print(
            "Payload:",
            payload
        )

        return payload

    except Exception as e:
        print(
            "ERROR:",
            e
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

async def verify_admin(
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
            status_code=404,
            detail="User not found"
        )

    if user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user

async def save_image(
        image: UploadFile,
        folder: str = "uploads"
):
    os.makedirs(
        folder,
        exist_ok=True
    )

    extension = image.filename.split(".")[-1]

    filename = (
        f"{uuid4()}.{extension}"
    )

    path = os.path.join(
        folder,
        filename
    )

    content = await image.read()

    with open(
            path,
            "wb"
    ) as f:
        f.write(content)

    return path


def delete_image(
        image_path: str
):
    if os.path.exists(
            image_path
    ):
        os.remove(
            image_path
        )

def _save_file(file: UploadFile) -> str:
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WEBP images are allowed"
        )
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path


def rate_limit(max_requests: int, window: int):
    async def dependency(request: Request):
        ip = request.client.host
        key = f"rate_limit:{ip}"

        requests = await redis_client.get(key)

        if requests is None:
            await redis_client.set(key, 1, ex=window)
            return

        if int(requests) >= max_requests:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )

        await redis_client.incr(key)

    return dependency