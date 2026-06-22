# schemas/movie_schema.py

from pydantic import BaseModel
from datetime import datetime
from .genre_schema import GenreResponse
from .movie_image_schema import MovieImageResponse


class MovieCreate(BaseModel):
    title: str
    description: str
    release_year: int
    duration: int
    language: str
    rating: float
    poster_url: str
    trailer_url: str
    genre_id: int


class MovieUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    release_year: int | None = None
    duration: int | None = None
    language: str | None = None
    rating: float | None = None
    poster_url: str | None = None
    trailer_url: str | None = None
    genre_id: int | None = None


class MovieResponse(BaseModel):
    id: int
    title: str
    description: str
    release_year: int
    duration: int
    language: str
    rating: float
    poster_url: str
    trailer_url: str
    created_at: datetime
    updated_at: datetime
    genre: GenreResponse
    images: list[MovieImageResponse]

    class Config:
        from_attributes = True