from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from movie_backend.database.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)

    release_year = Column(Integer)
    duration = Column(Integer)
    language = Column(String)

    rating = Column(Float)

    poster_url = Column(String)
    trailer_url = Column(String)

    genre_id = Column(Integer, ForeignKey("genres.id"))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    genre = relationship(
        "Genre",
        back_populates="movies"
    )

    images = relationship(
        "MovieImage",
        back_populates="movie",
        cascade="all, delete"
    )