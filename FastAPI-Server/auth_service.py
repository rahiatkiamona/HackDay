import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Tuple
from uuid import uuid4
from sqlalchemy.orm import Session
from models import User, RefreshToken
from config import settings
import re

def parse_expiration_time(expires_in: str) -> timedelta:
    """Parse expiration time string like '15m', '7d' to timedelta"""
    match = re.match(r'(\d+)([mhd])', expires_in.lower())
    if not match:
        raise ValueError(f"Invalid expiration format: {expires_in}")
    
    amount, unit = int(match.group(1)), match.group(2)
    if unit == 'm':
        return timedelta(minutes=amount)
    elif unit == 'h':
        return timedelta(hours=amount)
    elif unit == 'd':
        return timedelta(days=amount)
    else:
        raise ValueError(f"Unknown time unit: {unit}")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def hash_token(token: str) -> str:
    """Hash token using bcrypt"""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(token.encode('utf-8'), salt).decode('utf-8')

def generate_access_token(user_id: int, email: str) -> str:
    """Generate access JWT token"""
    payload = {
        'sub': str(user_id),
        'email': email,
        'exp': datetime.utcnow() + parse_expiration_time(settings.JWT_ACCESS_EXPIRES_IN)
    }
    return jwt.encode(payload, settings.JWT_ACCESS_SECRET, algorithm='HS256')

def generate_refresh_token(user_id: int) -> Tuple[str, str, datetime]:
    """Generate refresh JWT token with JTI"""
    jti = str(uuid4())
    expires_in = parse_expiration_time(settings.JWT_REFRESH_EXPIRES_IN)
    expires_at = datetime.utcnow() + expires_in
    
    payload = {
        'sub': str(user_id),
        'jti': jti,
        'exp': expires_at
    }
    token = jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm='HS256')
    return token, jti, expires_at

def persist_refresh_token(db: Session, user_id: int, token: str, jti: str, expires_at: datetime):
    """Store refresh token hash in database"""
    token_hash = hash_token(token)
    refresh_token = RefreshToken(
        jti=jti,
        token_hash=token_hash,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(refresh_token)
    db.commit()

def register_user(db: Session, email: str, password: str):
    """Register new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise ValueError("Email already in use")
    
    # Create new user
    password_hash = hash_password(password)
    user = User(email=email, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = generate_access_token(user.id, user.email)
    refresh_token, jti, expires_at = generate_refresh_token(user.id)
    persist_refresh_token(db, user.id, refresh_token, jti, expires_at)
    
    return {
        'user': {'id': user.id, 'email': user.email},
        'tokens': {'accessToken': access_token, 'refreshToken': refresh_token}
    }

def login_user(db: Session, email: str, password: str):
    """Login user with email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid credentials")
    
    # Generate tokens
    access_token = generate_access_token(user.id, user.email)
    refresh_token, jti, expires_at = generate_refresh_token(user.id)
    persist_refresh_token(db, user.id, refresh_token, jti, expires_at)
    
    return {
        'user': {'id': user.id, 'email': user.email},
        'tokens': {'accessToken': access_token, 'refreshToken': refresh_token}
    }

def refresh_session(db: Session, refresh_token: str):
    """Refresh user session with refresh token"""
    try:
        payload = jwt.decode(refresh_token, settings.JWT_REFRESH_SECRET, algorithms=['HS256'])
    except jwt.InvalidTokenError:
        raise ValueError("Invalid refresh token")
    
    user_id = payload.get('sub')
    jti = payload.get('jti')
    
    if not user_id or not jti:
        raise ValueError("Invalid refresh token payload")
    
    # Check if token exists and is not revoked
    token_record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not token_record or token_record.revoked:
        raise ValueError("Refresh token revoked or missing")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise ValueError("User not found")
    
    # Generate new access token
    access_token = generate_access_token(user.id, user.email)
    
    return {
        'user': {'id': user.id, 'email': user.email},
        'tokens': {'accessToken': access_token, 'refreshToken': refresh_token}
    }

def revoke_tokens_for_user(db: Session, user_id: int):
    """Revoke all refresh tokens for a user"""
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({'revoked': True})
    db.commit()
