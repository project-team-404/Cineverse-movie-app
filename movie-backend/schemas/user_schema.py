from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    name: str
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class LogoutResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    name: str
    email: EmailStr

    class Config:
        from_attributes = True