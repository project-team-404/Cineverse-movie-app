from pydantic import BaseModel



class MovieImageCreate(BaseModel):
    image_url: str


class MovieImageResponse(BaseModel):
    id: int
    image_url: str


    class Config:
        from_attributes = True