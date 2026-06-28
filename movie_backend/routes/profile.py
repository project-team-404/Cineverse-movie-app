from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token
from movie_backend.util.helpers import rate_limit
from movie_backend.schemas.profile_schema import ProfileResponse
from movie_backend.schemas.response_schema import MessageResponse

from movie_backend.services.profile_service import (
    create_profile_service,
    get_profile_service,
    update_profile_service,
    delete_profile_service
)

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.post(
    "/",
    response_model=ProfileResponse,
    status_code=201,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def create_profile(
    preferred_language: Optional[str] = Form(None),
    favorite_movie: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    from movie_backend.schemas.profile_schema import ProfileCreate
    data = ProfileCreate(
        preferred_language=preferred_language,
        favorite_movie=favorite_movie
    )
    return await create_profile_service(data, db, current_user, photo)


@router.get(
    "/",
    response_model=ProfileResponse,
    dependencies=[Depends(rate_limit(60, 60))]
)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await get_profile_service(db, current_user)


@router.patch(
    "/",
    response_model=ProfileResponse,
    dependencies=[Depends(rate_limit(10, 60))]
    
)
async def update_profile(
    preferred_language: Optional[str] = Form(None),
    favorite_movie: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    from movie_backend.schemas.profile_schema import ProfileUpdate
    data = ProfileUpdate(
        preferred_language=preferred_language,
        favorite_movie=favorite_movie
    )
    return await update_profile_service(data, db, current_user, photo)


@router.delete(
    "/",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def delete_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await delete_profile_service(db, current_user)