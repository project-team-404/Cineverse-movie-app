from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.services.genres_service import get_genres_service

router = APIRouter(prefix="/genres", tags=["Genres"])


@router.get("/")
async def get_genres(
    db: AsyncSession = Depends(get_db)
):
    return await get_genres_service(db)