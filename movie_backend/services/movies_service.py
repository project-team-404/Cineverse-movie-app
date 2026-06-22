from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from movie_backend.models.genre import Genre
from movie_backend.models.movie import Movie


async def get_movies_service(
    page: int,
    limit: int,
    db: AsyncSession
):
    offset = (page - 1) * limit

    statement = (
        select(Movie)
        .options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(statement)

    movies = result.scalars().all()

    return movies


async def get_movie_service(
    movie_id: int,
    db: AsyncSession
):
    statement = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
    )

    result = await db.execute(statement)

    movie = result.scalar_one_or_none()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )

    return movie


async def search_movies_service(
    q: str,
    page: int,
    limit: int,
    db: AsyncSession
):
    offset = (page - 1) * limit

    statement = (
        select(Movie)
        .where(
            Movie.title.ilike(f"%{q}%")
        )
        .options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(statement)

    movies = result.scalars().all()

    return movies


async def filter_movies_service(
    genre: str | None,
    language: str | None,
    year: int | None,
    page: int,
    limit: int,
    db: AsyncSession
):
    offset = (page - 1) * limit

    statement = (
        select(Movie)
        .join(Movie.genre)
        .options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
    )

    if genre:
        statement = statement.where(
            Genre.name.ilike(f"%{genre}%")
        )

    if language:
        statement = statement.where(
            Movie.language.ilike(f"%{language}%")
        )

    if year:
        statement = statement.where(
            Movie.release_year == year
        )

    statement = (
        statement
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(statement)

    movies = result.scalars().all()

    return movies