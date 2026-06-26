from pydantic import BaseModel
from movie_backend.schemas.movie_schema import MovieResponse

class AllFavoriteResponse(BaseModel):
    id: int
    movie: MovieResponse

    class Config:
        from_attributes = True

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int

    class Config:
        from_attributes = True