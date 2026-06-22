from pydantic import BaseModel
from datetime import datetime


class GenreCreate(BaseModel):
    name: str


class GenreUpdate(BaseModel):
    name: str


class GenreResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True