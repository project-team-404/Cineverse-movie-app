from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)
from sqlalchemy.orm import relationship

from movie_app.movie_backend.database.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    content = Column(
        String,
        nullable=False
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
        back_populates="reviews"
    )

    movie = relationship(
        "Movie",
        back_populates="reviews"
    )