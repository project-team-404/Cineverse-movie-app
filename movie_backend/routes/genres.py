from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.services.genres_service import get_genres_service
from movie_backend.schemas.genre_schema import GenreResponse
from movie_backend.util.helpers import rate_limit
from typing import List

router = APIRouter(prefix="/genres", tags=["Genres"])


@router.get("/",response_model=List[GenreResponse],dependencies=[Depends(rate_limit(100, 60))])
async def get_genres(
    db: AsyncSession = Depends(get_db)
):
    return await get_genres_service(db)