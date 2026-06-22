from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from movie_backend.database.database import Base


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    movies = relationship(
        "Movie",
        back_populates="genre",
        cascade="all, delete"
    )