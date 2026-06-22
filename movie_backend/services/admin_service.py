from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.schemas.movie_schema import (
    MovieCreate,
    MovieUpdate
)

from movie_backend.schemas.genre_schema import (
    GenreCreate,
    GenreUpdate
)


async def create_movie_service(
    request: MovieCreate,
    db: AsyncSession,
    current_user
):
    pass


async def update_movie_service(
    movie_id: int,
    request: MovieUpdate,
    db: AsyncSession,
    current_user
):
    pass


async def delete_movie_service(
    movie_id: int,
    db: AsyncSession,
    current_user
):
    pass


async def create_genre_service(
    request: GenreCreate,
    db: AsyncSession,
    current_user
):
    pass


async def update_genre_service(
    genre_id: int,
    request: GenreUpdate,
    db: AsyncSession,
    current_user
):
    pass


async def delete_genre_service(
    genre_id: int,
    db: AsyncSession,
    current_user
):
    pass


async def add_movie_image_service(
    movie_id: int,
    image: UploadFile,
    db: AsyncSession,
    current_user
):
    pass


async def delete_movie_image_service(
    image_id: int,
    db: AsyncSession,
    current_user
):
    pass