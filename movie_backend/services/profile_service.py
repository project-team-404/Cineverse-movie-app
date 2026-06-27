import os


from fastapi import HTTPException, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from movie_backend.models.profile import Profile
from movie_backend.schemas.profile_schema import ProfileCreate, ProfileUpdate
from movie_backend.util.helpers import _save_file

UPLOAD_DIR = "uploads/profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)



async def create_profile_service(
    data: ProfileCreate,
    db: AsyncSession,
    current_user,
    photo: UploadFile
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this user"
        )

    file_path = _save_file(photo) if photo else None

    profile = Profile(
        user_id=current_user["id"],
        preferred_language=data.preferred_language,
        favorite_movie=data.favorite_movie,
        profile_picture=file_path
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_profile_service(
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile


async def update_profile_service(
    data: ProfileUpdate,
    db: AsyncSession,
    current_user,
    photo: UploadFile = None
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    if photo:
        # Delete old photo if exists
        if profile.profile_picture and os.path.exists(profile.profile_picture):
            os.remove(profile.profile_picture)
        profile.profile_picture = _save_file(photo)

    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_profile_service(
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    if profile.profile_picture and os.path.exists(profile.profile_picture):
        os.remove(profile.profile_picture)

    await db.delete(profile)
    await db.commit()
    return {"message": "Profile deleted successfully"}