from collections import Counter
import json

from langchain_core.tools import tool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from movie_app.movie_backend.models.user import User
from movie_app.movie_backend.models.favorite import Favorite
from movie_app.movie_backend.models.movie import Movie


def create_user_favorite_genre_count_tool(
    db: AsyncSession,
    user_id: int
):
    @tool
    async def user_favorite_genre_count():
        """
        Returns the user's favourite movies and favourite genre statistics.

        Use this tool whenever recommendations should be influenced
        by the user's favourites.
        """

        statement = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.favorites)
                .selectinload(Favorite.movie)
                .selectinload(Movie.genre)
            )
        )

        result = await db.execute(statement)

        user = result.scalar_one()

        genre_count = Counter()

        for favorite in user.favorites:
            genre = favorite.movie.genre.name
            genre_count[genre] += 1

        return json.dumps(dict(genre_count))

    return user_favorite_genre_count