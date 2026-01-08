from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from database import get_db, init_db
from config import settings
from schemas import (
    UserRegister, UserLogin, TokenRefresh, AuthResponse,
    LogoutRequest, HealthResponse, MessageCreate, MessageResponse, 
    MessageMarkRead, SecretCodeAuth, UserIdResponse
)
from auth_service import register_user, login_user, refresh_session, revoke_tokens_for_user
from models import Message, User
import uvicorn
import logging
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(title="Auth Server", version="0.1.0")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Error handling
class HTTPErrorDetail:
    """Custom HTTP error response"""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

@app.exception_handler(ValueError)
async def value_error_exception_handler(request, exc):
    """Handle ValueError with appropriate HTTP status"""
    if "Invalid credentials" in str(exc):
        raise HTTPException(status_code=401, detail=str(exc))
    elif "Email already in use" in str(exc):
        raise HTTPException(status_code=409, detail=str(exc))
    elif "Invalid refresh token" in str(exc) or "User not found" in str(exc):
        raise HTTPException(status_code=401, detail=str(exc))
    else:
        raise HTTPException(status_code=400, detail=str(exc))

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
async def register(request: UserRegister, db: Session = Depends(get_db)):
    """Register new user"""
    try:
        result = register_user(db, request.email, request.password)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=409 if "already in use" in str(e) else 400,
            detail=str(e)
        )

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    try:
        result = login_user(db, request.email, request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/auth/refresh", response_model=AuthResponse)
async def refresh(request: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token"""
    try:
        result = refresh_session(db, request.refreshToken)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/auth/logout")
async def logout(request: LogoutRequest, db: Session = Depends(get_db)):
    """Logout user by revoking all refresh tokens"""
    try:
        revoke_tokens_for_user(db, request.userId)
        return {"message": "Logged out"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Secret Code Authentication
@app.post("/api/auth/secret-code", response_model=UserIdResponse)
async def authenticate_with_secret_code(request: SecretCodeAuth, db: Session = Depends(get_db)):
    """Authenticate user with secret code and return user ID"""
    try:
        user = db.query(User).filter(User.secret_code == request.secret_code).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid secret code")
        
        return UserIdResponse(user_id=user.id, email=user.email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/users/{user_id}/secret-code")
async def set_secret_code(user_id: int, request: SecretCodeAuth, db: Session = Depends(get_db)):
    """Set or update secret code for a user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if secret code already exists for another user
        existing = db.query(User).filter(
            User.secret_code == request.secret_code,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Secret code already in use")
        
        user.secret_code = request.secret_code
        db.commit()
        return {"message": "Secret code set successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Message Routes
@app.post("/api/messages", response_model=MessageResponse, status_code=201)
async def create_message(request: MessageCreate, secret_code: str, db: Session = Depends(get_db)):
    """Create a new message for a user (identified by secret code)"""
    try:
        # Find user by secret code
        user = db.query(User).filter(User.secret_code == secret_code).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found with that secret code")
        
        # Create message
        message = Message(
            sender_name=request.sender_name,
            sender_email=request.sender_email,
            subject=request.subject,
            content=request.content,
            user_id=user.id
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(user_id: str, unread_only: bool = False, db: Session = Depends(get_db)):
    """Get all messages for a user (identified by secret code or user ID)"""
    try:
        # Try to find user by secret code first, then by ID
        user = db.query(User).filter(User.secret_code == user_id).first()
        if not user and user_id.isdigit():
            user = db.query(User).filter(User.id == int(user_id)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Query messages
        query = db.query(Message).filter(Message.user_id == user.id)
        if unread_only:
            query = query.filter(Message.is_read == False)
        
        messages = query.order_by(Message.created_at.desc()).all()
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/messages/{message_id}/read")
async def mark_message_read(message_id: int, db: Session = Depends(get_db)):
    """Mark a message as read"""
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        message.is_read = True
        db.commit()
        return {"message": "Message marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: int, db: Session = Depends(get_db)):
    """Delete a message"""
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        db.delete(message)
        db.commit()
        return {"message": "Message deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.PORT,
        log_level="info"
    )
