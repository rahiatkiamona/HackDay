from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class TokenRefresh(BaseModel):
    refreshToken: str = Field(min_length=10)

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str

class UserResponse(BaseModel):
    id: int
    email: str

class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse

class LogoutRequest(BaseModel):
    userId: int

class HealthResponse(BaseModel):
    status: str
