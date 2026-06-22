from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.services.movies_service import (
    get_movies_service,
    get_movie_service,
    search_movies_service,
    filter_movies_service
)

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/")
async def get_movies(
    db: AsyncSession = Depends(get_db)
):
    return await get_movies_service(db)


@router.get("/{movie_id}")
async def get_movie(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_movie_service(movie_id, db)


@router.get("/search/")
async def search_movies(
    q: str,
    db: AsyncSession = Depends(get_db)
):
    return await search_movies_service(q, db)


@router.get("/filter/")
async def filter_movies(
    genre: str | None = None,
    language: str | None = None,
    year: int | None = None,
    db: AsyncSession = Depends(get_db)
):
    return await filter_movies_service(
        genre,
        language,
        year,
        db
    )