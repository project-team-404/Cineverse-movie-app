from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_app.movie_backend.database.database import get_db
from movie_app.movie_backend.services.movies_service import (
    get_movies_service,
    get_movie_service,
    search_movies_service,
    filter_movies_service,
    home_service
)

from movie_app.movie_backend.schemas.movie_schema import MovieResponse,HomePageResponse
from movie_app.movie_backend.util.helpers import rate_limit
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


@router.get("/",response_model=List[MovieResponse],dependencies=[Depends(rate_limit(100, 60))])
async def get_movies(
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Get movies request received. Page: {page}, Limit: {limit}")
    return await get_movies_service(
        page,
        limit,
        db
    )


@router.get("/{movie_id}",response_model=MovieResponse,dependencies=[Depends(rate_limit(100, 60))])
async def get_movie(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Get movie request received. Movie ID: {movie_id}")
    return await get_movie_service(
        movie_id,
        db
    )


@router.get("/search/",response_model=List[MovieResponse],dependencies=[Depends(rate_limit(60, 60))])
async def search_movies(
    q: str,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Search movies request received. Query: '{q}', Page: {page}, Limit: {limit}")
    return await search_movies_service(
        q,
        page,
        limit,
        db
    )


@router.get("/filter/",response_model=List[MovieResponse],dependencies=[Depends(rate_limit(60, 60))])
async def filter_movies(
    genre: str | None = None,
    language: str | None = None,
    year: int | None = None,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Filter movies request received. Genre: {genre}, Language: {language}, Year: {year}, Page: {page}, Limit: {limit}")
    return await filter_movies_service(
        genre,
        language,
        year,
        page,
        limit,
        db
    )

@router.get("/home/",response_model=HomePageResponse)
async def home(db: AsyncSession = Depends(get_db)):
    logger.info("Home page data request received.")
    return await home_service(db)