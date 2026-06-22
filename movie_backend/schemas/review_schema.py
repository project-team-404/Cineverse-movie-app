from pydantic import BaseModel


class ReviewCreate(BaseModel):
    rating: int
    content: str


class ReviewUpdate(BaseModel):
    rating: int | None = None
    content: str | None = None


class ReviewResponse(BaseModel):
    id: int
    rating: int
    content: str
    user_id: int
    movie_id: int

    class Config:
        from_attributes = True