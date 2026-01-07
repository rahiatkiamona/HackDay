# FastAPI Authentication Server

A FastAPI-based authentication server with JWT token management and MySQL database support.

## Features

- User registration and login
- JWT-based authentication (access + refresh tokens)
- Token refresh functionality
- Token revocation (logout)
- MySQL database integration
- CORS support
- Security headers (Helmet equivalent)

## Prerequisites

- Python 3.8+
- MySQL Server

## Setup

### 1. Create a Python Virtual Environment

```bash
python -m venv venv
source venv/Scripts/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update `.env` with your MySQL credentials:

```
DATABASE_URL=mysql+mysql-connector://username:password@localhost:3306/auth_db
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
```

### 4. Initialize Database

The database tables will be created automatically when you run the server for the first time.

### 5. Run the Server

```bash
python main.py
```

The server will start on `http://localhost:4000`

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Authentication
- **POST** `/api/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- **POST** `/api/auth/refresh` - Refresh access token
  ```json
  {
    "refreshToken": "token_here"
  }
  ```

- **POST** `/api/auth/logout` - Logout user
  ```json
  {
    "userId": 1
  }
  ```

## Project Structure

```
FastAPI-Server/
├── main.py              # FastAPI application and routes
├── config.py            # Configuration and environment variables
├── database.py          # Database setup and session management
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic request/response schemas
├── auth_service.py      # Authentication business logic
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (local)
├── .env.example         # Environment variables template
└── README.md            # This file
```

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `created_at` - User creation timestamp
- `updated_at` - User update timestamp

### Refresh Tokens Table
- `id` - Primary key
- `jti` - Unique JWT ID
- `token_hash` - Bcrypt hashed token
- `revoked` - Token revocation status
- `created_at` - Token creation timestamp
- `expires_at` - Token expiration timestamp
- `user_id` - Foreign key to users

## Security Features

- Password hashing with bcrypt (12 rounds)
- Token hashing with bcrypt (10 rounds)
- JWT token signing and verification
- CORS enabled for cross-origin requests
- Unique JTI (JWT ID) for token tracking
- Token revocation support

## Development

To run the server with auto-reload during development:

```bash
pip install uvicorn[standard]
uvicorn main:app --reload --port 4000
```

## Differences from Node.js Version

- **Framework**: Express → FastAPI
- **Database**: Prisma + SQLite → SQLAlchemy + MySQL
- **ORM**: Prisma → SQLAlchemy
- **Validation**: Zod → Pydantic
- **Server**: Express → Uvicorn
- **Async**: Promise-based → async/await (native)

## License

MIT
