"""
Setup script to create a test user with secret code
"""
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User
import bcrypt

def create_test_user():
    """Create a test user with secret code 6789"""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "testuser@example.com").first()
        if existing_user:
            print(f"User already exists with ID: {existing_user.id}")
            if not existing_user.secret_code:
                existing_user.secret_code = "6789"
                db.commit()
                print("Secret code '6789' added to existing user")
            else:
                print(f"User already has secret code: {existing_user.secret_code}")
            return existing_user.id
        
        # Create new user
        password = "testpassword123"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            email="testuser@example.com",
            password_hash=password_hash,
            secret_code="6789"
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✓ Test user created successfully!")
        print(f"  User ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Secret Code: 6789")
        print(f"\nTo authenticate in calculator:")
        print(f"  1. Enter: 6789")
        print(f"  2. Press: =")
        print(f"  3. Your User ID will be displayed: {user.id}")
        
        return user.id
        
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
