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

class MessageCreate(BaseModel):
    sender_name: str = Field(min_length=1, max_length=255)
    sender_email: EmailStr
    subject: Optional[str] = Field(None, max_length=500)
    content: str = Field(min_length=1)

class MessageResponse(BaseModel):
    id: int
    sender_name: str
    sender_email: str
    subject: Optional[str]
    content: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageMarkRead(BaseModel):
    message_id: int

class SecretCodeAuth(BaseModel):
    secret_code: str = Field(min_length=4, max_length=50)

class UserIdResponse(BaseModel):
    user_id: int
    email: str

