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
    # Analysis history indexes
    db.analysis_history.create_index("id", unique=True)
    db.analysis_history.create_index("userId")
    db.analysis_history.create_index("analysisType")
    db.analysis_history.create_index("createdAt")
    # Chat message indexes
    db.chat_messages.create_index("id", unique=True)
    db.chat_messages.create_index("timestamp")
    # Private message indexes
    db.private_messages.create_index("id", unique=True)
    db.private_messages.create_index([("fromUserId", 1), ("toUserId", 1)])
    db.private_messages.create_index("timestamp")
    seed_admin_user()

# Analysis History CRUD functions
def create_analysis_history(db: Database, data: dict) -> dict:
    """Create a new analysis history record"""
    db.analysis_history.insert_one(data)
    return data

def get_analysis_history_by_user(db: Database, user_id: str, skip: int = 0, limit: int = 20) -> dict:
    """Get analysis history for a user with pagination"""
    query = {"userId": user_id}
    total = db.analysis_history.count_documents(query)
    items = list(db.analysis_history.find(query).sort("createdAt", -1).skip(skip).limit(limit))
    return {"items": items, "total": total}

def get_analysis_history_by_id(db: Database, id: str) -> dict:
    """Get a specific analysis history record by ID"""
    return db.analysis_history.find_one({"id": id})

def delete_analysis_history(db: Database, id: str, user_id: str) -> bool:
    """Delete an analysis history record (only if owned by user)"""
    result = db.analysis_history.delete_one({"id": id, "userId": user_id})
    return result.deleted_count > 0

