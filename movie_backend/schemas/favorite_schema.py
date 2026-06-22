from pydantic import BaseModel


class FavoriteResponse(BaseModel):
    id: int
    movie_id: int

    class Config:
        from_attributes = True