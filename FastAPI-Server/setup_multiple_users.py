"""
Setup script to create multiple users with different secret codes
"""
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User
import bcrypt

def create_users():
    """Create multiple users with different secret codes"""
    init_db()
    db = SessionLocal()
    
    users_data = [
        {"email": "user1@example.com", "password": "password123", "secret_code": "6789", "name": "User 1"},
        {"email": "friend1@example.com", "password": "password123", "secret_code": "1357", "name": "Friend 1"},
        {"email": "friend2@example.com", "password": "password123", "secret_code": "2468", "name": "Friend 2"},
    ]
    
    try:
        created_users = []
        for user_data in users_data:
            # Check if user already exists by email
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"✓ {user_data['name']} already exists")
                print(f"  User ID: {existing_user.id}")
                print(f"  Email: {existing_user.email}")
                print(f"  Secret Code: {existing_user.secret_code}")
                print()
                created_users.append(existing_user)
                continue
            
            # Check if secret code is already used
            code_exists = db.query(User).filter(User.secret_code == user_data["secret_code"]).first()
            if code_exists:
                print(f"⚠ Secret code {user_data['secret_code']} already in use by {code_exists.email}")
                print(f"  Skipping {user_data['email']}")
                print()
                continue
            
            # Create new user
            password_hash = bcrypt.hashpw(user_data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user = User(
                email=user_data["email"],
                password_hash=password_hash,
                secret_code=user_data["secret_code"]
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            created_users.append(user)
            
            print(f"✓ {user_data['name']} created successfully!")
            print(f"  User ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Secret Code: {user_data['secret_code']}")
            print()
        
        print("\n" + "="*60)
        print("SETUP COMPLETE - Share these codes with your friends:")
        print("="*60)
        for i, user in enumerate(created_users):
            print(f"\nPerson {i+1}:")
            print(f"  User ID: {user.id}")
            print(f"  Secret Code: {user.secret_code}")
            print(f"  Email: {user.email}")
        
        print("\n" + "="*60)
        print("HOW TO USE:")
        print("="*60)
        print("1. Each person opens the calculator on their device")
        print("2. Enter YOUR secret code and press =")
        print("3. Enter 1234 and press = to unlock messages")
        print("4. Click clock icon → Messages tab")
        print("5. To send a message to someone, use their User ID")
        print("="*60)
        
        return created_users
        
    except Exception as e:
        db.rollback()
        print(f"Error creating users: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_users()
