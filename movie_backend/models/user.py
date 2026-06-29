from sqlalchemy import (
    Column,
    Integer,
    String
)
from sqlalchemy.orm import relationship

from movie_backend.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="USER"
    )

    favorites = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete"
    )

    reviews = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete"
    )

    watchlists = relationship(
        "Watchlist",
        back_populates="user",
        cascade="all, delete"
    )
    profile = relationship("Profile", back_populates="user",cascade="all, delete", uselist=False)
    
    watch_history = relationship("WatchHistory", back_populates="user")