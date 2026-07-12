from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)
from sqlalchemy.orm import relationship

from movie_app.movie_backend.database.database import Base


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    movie_id = Column(
        Integer,
        ForeignKey("movies.id")
    )

    user = relationship(
        "User",
        back_populates="watchlists"
    )

    movie = relationship(
        "Movie",
        back_populates="watchlists"
    )