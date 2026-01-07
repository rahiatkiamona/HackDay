from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from database import get_db, init_db
from config import settings
from schemas import (
    UserRegister, UserLogin, TokenRefresh, AuthResponse,
    LogoutRequest, HealthResponse
)
from auth_service import register_user, login_user, refresh_session, revoke_tokens_for_user
import uvicorn
import logging

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

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.PORT,
        log_level="info"
    )
