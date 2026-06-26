from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.models.favorite import Favorite
from movie_backend.models.movie import Movie
from sqlalchemy.orm import selectinload

async def add_favorite_service(
    movie_id: int,
    db: AsyncSession,
    current_user
):
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

    statement = select(Favorite).where(
        Favorite.user_id == current_user["id"],
        Favorite.movie_id == movie_id
    )

    result = await db.execute(statement)

    favorite = result.scalar_one_or_none()

    if favorite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already added to favorites"
        )

    favorite = Favorite(
        user_id=current_user["id"],
        movie_id=movie_id
    )

    db.add(favorite)

    await db.commit()

    await db.refresh(favorite)

    return favorite


async def remove_favorite_service(
    movie_id: int,
    db: AsyncSession,
    current_user
):
    statement = select(Favorite).where(
        Favorite.user_id == current_user["id"],
        Favorite.movie_id == movie_id
    )

    result = await db.execute(statement)

    favorite = result.scalar_one_or_none()

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )

    await db.delete(favorite)

    await db.commit()

    return {
        "message": "Favorite removed successfully"
    }


async def get_favorites_service(
    db: AsyncSession,
    current_user
):
    statement = (
        select(Favorite)
        .where(Favorite.user_id == current_user["id"])
        .options(
            selectinload(Favorite.movie).selectinload(Movie.genre),
            selectinload(Favorite.movie).selectinload(Movie.images)
        )
    )

    result = await db.execute(statement)

    return result.scalars().all()