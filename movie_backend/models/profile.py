from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)
from sqlalchemy.orm import relationship

from movie_app.movie_backend.database.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True
    )

    preferred_language = Column(
        String,
        nullable=True
    )

    favorite_movie = Column(
        String,
        nullable=True
    )

    profile_picture = Column(
        String,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="profile"
    )