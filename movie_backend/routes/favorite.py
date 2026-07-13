from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_app.movie_backend.database.database import get_db
from movie_app.movie_backend.util.helpers import verify_token
from movie_app.movie_backend.util.helpers import rate_limit

from movie_app.movie_backend.schemas.favorite_schema import (
    FavoriteResponse,
    AllFavoriteResponse
)

from movie_app.movie_backend.schemas.response_schema import (
    MessageResponse
)


from movie_app.movie_backend.services.favorite_service import (
    add_favorite_service,
    remove_favorite_service,
    get_favorites_service
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)


@router.post(
    "/{movie_id}",
    response_model=FavoriteResponse,
    dependencies=[Depends(rate_limit(20, 60))]
)
async def add_favorite(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Add favorite request received. Movie ID: {movie_id}, User ID: {current_user.id}")
    return await add_favorite_service(
        movie_id,
        db,
        current_user
    )


@router.delete(
    "/{movie_id}",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(20, 60))]
)
async def remove_favorite(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Remove favorite request received. Movie ID: {movie_id}, User ID: {current_user.id}")
    return await remove_favorite_service(
        movie_id,
        db,
        current_user
    )


@router.get(
    "/",
    response_model=list[FavoriteResponse],
    dependencies=[Depends(rate_limit(60, 60))]
)
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Get favorites request received. User ID: {current_user.id}")
    return await get_favorites_service(
        db,
        current_user
    )