from pydantic import BaseModel
from typing import Optional


class ProfileCreate(BaseModel):
    preferred_language: Optional[str] = None
    favorite_movie: Optional[str] = None


class ProfileUpdate(BaseModel):
    preferred_language: Optional[str] = None
    favorite_movie: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    preferred_language: Optional[str] = None
    favorite_movie: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True