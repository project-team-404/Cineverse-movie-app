from fastapi import UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from movie_backend.models.genre import Genre
from movie_backend.models.movie import Movie
from movie_backend.models.movie_image import MovieImage

from movie_backend.schemas.movie_schema import (
    MovieCreate,
    MovieUpdate
)

from movie_backend.schemas.genre_schema import (
    GenreCreate,
    GenreUpdate
)

from movie_backend.util.helpers import (
    save_image,
    delete_image,
    verify_admin
)


from movie_backend.ai.vectorstore.helpers import (
    add_movie,
    update_movie,
    delete_movie

)

async def create_movie_service(
    request: MovieCreate,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    movie = Movie(
        **request.model_dump()
    )

    db.add(movie)
    await db.commit()

    statement = (
        select(Movie)
        .where(Movie.id == movie.id)
        .options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
    )

    result = await db.execute(statement)

    loaded_movie = result.scalar_one()

    add_movie(loaded_movie)

    return loaded_movie


async def update_movie_service(
    movie_id: int,
    request: MovieUpdate,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    statement = select(Movie).where(
        Movie.id == movie_id
    )

    result = await db.execute(statement)

    movie = result.scalar_one_or_none()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )

    for key, value in request.model_dump(
        exclude_unset=True
    ).items():
        setattr(movie, key, value)

    await db.commit()

    statement = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
    )

    result = await db.execute(statement)

    loaded_movie = result.scalar_one()

    update_movie(loaded_movie)

    return loaded_movie


async def delete_movie_service(
    movie_id: int,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    statement = select(Movie).where(
        Movie.id == movie_id
    )

    result = await db.execute(statement)

    movie = result.scalar_one_or_none()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )

    await db.delete(movie)
    delete_movie(movie.id)
    await db.commit()

    return {
        "message": "Movie deleted successfully"
    }


async def create_genre_service(
    request: GenreCreate,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    genre = Genre(
        **request.model_dump()
    )

    db.add(genre)

    await db.commit()

    await db.refresh(genre)

    return genre


async def update_genre_service(
    genre_id: int,
    request: GenreUpdate,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    statement = select(Genre).where(
        Genre.id == genre_id
    )

    result = await db.execute(statement)

    genre = result.scalar_one_or_none()

    if not genre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genre not found"
        )

    for key, value in request.model_dump(
        exclude_unset=True
    ).items():
        setattr(genre, key, value)

    await db.commit()

    await db.refresh(genre)

    return genre


async def delete_genre_service(
    genre_id: int,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    statement = select(Genre).where(
        Genre.id == genre_id
    )

    result = await db.execute(statement)

    genre = result.scalar_one_or_none()

    if not genre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genre not found"
        )

    await db.delete(genre)

    await db.commit()

    return {
        "message": "Genre deleted successfully"
    }


async def add_movie_image_service(
    movie_id: int,
    image: UploadFile,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    statement = select(Movie).where(
        Movie.id == movie_id
    )

    result = await db.execute(statement)

    movie = result.scalar_one_or_none()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )

    image_path = await save_image(image)

    movie_image = MovieImage(
        image_url=image_path,
        movie_id=movie_id
    )

    db.add(movie_image)

    await db.commit()

    await db.refresh(movie_image)

    return movie_image


async def delete_movie_image_service(
    image_id: int,
    db: AsyncSession,
    current_user
):
    await verify_admin(current_user, db)

    statement = select(MovieImage).where(
        MovieImage.id == image_id
    )

    result = await db.execute(statement)

    movie_image = result.scalar_one_or_none()

    if not movie_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    delete_image(
        movie_image.image_url
    )

    await db.delete(movie_image)

    await db.commit()

    return {
        "message": "Image deleted successfully"
    }