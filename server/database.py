from pymongo import MongoClient
from pymongo.database import Database
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "networking-quiz")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None

def get_database() -> Database:
    global _db
    if _db is None:
        global _client
        _client = MongoClient(MONGODB_URL)
        _db = _client[DATABASE_NAME]
    return _db

def get_db():
    """Dependency for FastAPI to get database instance"""
    db = get_database()
    try:
        yield db
    finally:
        pass

def seed_admin_user():
    """Seed admin user if not exists"""
    from auth import get_user_by_email, create_user
    
    db = get_database()
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_name = os.getenv("ADMIN_NAME", "Administrator")
    
    existing_admin = get_user_by_email(db, admin_email)
    if not existing_admin:
        create_user(db, admin_email, admin_password, admin_name, role="admin")
        print(f"Admin user created: {admin_email}")
    else:
        print(f"Admin user already exists: {admin_email}")



def init_db():
    """Initialize database - create indexes and seed admin user"""
    db = get_database()
    db.users.create_index("email", unique=True)
    db.users.create_index("id", unique=True)
    db.quizzes.create_index("id", unique=True)
    db.quizzes.create_index("createdBy")
    db.quizzes.create_index("createdAt")
    db.attempts.create_index("id", unique=True)
    db.attempts.create_index("quizId")
    db.attempts.create_index("studentId")
    seed_admin_user()
