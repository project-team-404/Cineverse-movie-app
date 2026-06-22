from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship


from movie_backend.database.database import Base


class MovieImage(Base):
    __tablename__ = "movie_images"

    id = Column(Integer, primary_key=True, index=True)

    image_url = Column(String, nullable=False)

    movie_id = Column(
        Integer,
        ForeignKey("movies.id")
    )


    movie = relationship(
        "Movie",
        back_populates="images"
    )