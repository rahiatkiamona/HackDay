"""
Migration script to add secret_code column to users table
"""
from database import engine
from sqlalchemy import text

def add_secret_code_column():
    """Add secret_code column to users table"""
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = 'auth_db' 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'secret_code'
            """))
            
            exists = result.fetchone()[0] > 0
            
            if exists:
                print("Column 'secret_code' already exists in users table")
                return
            
            # Add the column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN secret_code VARCHAR(50) NULL UNIQUE
            """))
            conn.commit()
            
            print("✓ Successfully added 'secret_code' column to users table")
            
    except Exception as e:
        print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_secret_code_column()
