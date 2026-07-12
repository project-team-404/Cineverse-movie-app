from collections import Counter
import json

from langchain_core.tools import tool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from movie_app.movie_backend.models.user import User
from movie_app.movie_backend.models.watch_history import WatchHistory
from movie_app.movie_backend.models.movie import Movie


def create_user_history_genre_count_tool(
    db: AsyncSession,
    user_id: int
):
    @tool
    async def user_history_genre_count():
        """
        Returns the user's watch history statistics.

        Use this tool to personalize recommendations based on
        the user's viewing behaviour, favourite genres,
        recently watched genres and watch frequency.
        """

        statement = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.watch_history)
                .selectinload(WatchHistory.movie)
                .selectinload(Movie.genre)
            )
        )

        result = await db.execute(statement)

        user = result.scalar_one()

        genre_count = Counter()

        for history in user.watch_history:
            genre = history.movie.genre.name
            genre_count[genre] += 1

        return json.dumps(dict(genre_count))

    return user_history_genre_count