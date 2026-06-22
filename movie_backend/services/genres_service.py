from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.models.genre import Genre


async def get_genres_service(
    db: AsyncSession
):
    statement = select(Genre)

    result = await db.execute(statement)

    genres = result.scalars().all()

    if not genres:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No genres found"
        )

    return genres