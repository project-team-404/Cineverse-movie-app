from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token

from movie_backend.schemas.favorite_schema import (
    FavoriteResponse
)

from movie_backend.schemas.response_schema import (
    MessageResponse
)

from movie_backend.services.favorite_service import (
    add_favorite_service,
    remove_favorite_service,
    get_favorites_service
)

router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)


@router.post(
    "/{movie_id}",
    response_model=FavoriteResponse
)
async def add_favorite(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await add_favorite_service(
        movie_id,
        db,
        current_user
    )


@router.delete(
    "/{movie_id}",
    response_model=MessageResponse
)
async def remove_favorite(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await remove_favorite_service(
        movie_id,
        db,
        current_user
    )


@router.get(
    "/",
    response_model=list[FavoriteResponse]
)
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await get_favorites_service(
        db,
        current_user
    )