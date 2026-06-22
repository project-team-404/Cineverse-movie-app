from sqlalchemy.ext.asyncio import AsyncSession


async def get_movies_service(
    db: AsyncSession
):
    pass


async def get_movie_service(
    movie_id: int,
    db: AsyncSession
):
    pass


async def search_movies_service(
    q: str,
    db: AsyncSession
):
    pass


async def filter_movies_service(
    genre: str | None,
    language: str | None,
    year: int | None,
    db: AsyncSession
):
    pass