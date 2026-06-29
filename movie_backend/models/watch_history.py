from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from movie_backend.database.database import Base
from sqlalchemy.orm import relationship


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    watched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="watch_history")
    movie = relationship("Movie", back_populates="watch_history")