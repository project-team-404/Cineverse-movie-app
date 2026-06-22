from pydantic import BaseModel
from datetime import datetime


class MovieImageCreate(BaseModel):
    image_url: str


class MovieImageResponse(BaseModel):
    id: int
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True