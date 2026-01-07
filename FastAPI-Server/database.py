from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.engine import URL
from config import settings

# Create database engine with MySQL using SQLAlchemy URL object
url = URL.create(
    drivername="mysql+pymysql",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,  # Pass raw password, URL object handles encoding
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME
)

# First connect without specifying a database to create it if needed
temp_url = URL.create(
    drivername="mysql+pymysql",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT
)

temp_engine = create_engine(temp_url, echo=False)

def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    with temp_engine.connect() as conn:
        result = conn.execute(text(f"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '{settings.DB_NAME}'"))
        if not result.fetchone():
            conn.execute(text(f"CREATE DATABASE {settings.DB_NAME}"))
            print(f"Database '{settings.DB_NAME}' created successfully")
        else:
            print(f"Database '{settings.DB_NAME}' already exists")
        conn.commit()

# Create the database if it doesn't exist
create_database_if_not_exists()

# Now create the main engine with the database
engine = create_engine(
    url,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database by creating all tables"""
    Base.metadata.create_all(bind=engine)
