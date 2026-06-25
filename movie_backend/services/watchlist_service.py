from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from movie_backend.models.watchlist import Watchlist
from movie_backend.models.movie import Movie

from sqlalchemy.orm import selectinload

async def add_watchlist_service(
    movie_id: int,
    db: AsyncSession,
    current_user
):
    movie = await db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )

    result = await db.execute(
        select(Watchlist).where(
            Watchlist.user_id == current_user["id"],
            Watchlist.movie_id == movie_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie already in watchlist"
        )

    entry = Watchlist(
        user_id=current_user["id"],
        movie_id=movie_id
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def remove_watchlist_service(
    movie_id: int,
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.user_id == current_user["id"],
            Watchlist.movie_id == movie_id
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not in watchlist"
        )

    await db.delete(entry)
    await db.commit()
    return {"message": "Removed from watchlist"}


async def get_watchlist_service(
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.user_id == current_user["id"]
        ).options(
            selectinload(Watchlist.movie).selectinload(Movie.genre),
            selectinload(Watchlist.movie).selectinload(Movie.images)
        )
    )
    return result.scalars().all()