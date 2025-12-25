# Copyright 2025 Nguyễn Ngọc Phú Tỷ
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from pymongo import MongoClient
from pymongo.database import Database
from typing import Optional
import os
from dotenv import load_dotenv
from datetime import datetime

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
    db.analysis_history.create_index("id", unique=True)
    db.analysis_history.create_index("userId")
    db.analysis_history.create_index("analysisType")
    db.analysis_history.create_index("createdAt")
    db.chat_messages.create_index("id", unique=True)
    db.chat_messages.create_index("timestamp")
    db.private_messages.create_index("id", unique=True)
    db.private_messages.create_index([("fromUserId", 1), ("toUserId", 1)])
    db.private_messages.create_index("timestamp")
    db.quiz_discussions.create_index("id", unique=True)
    db.quiz_discussions.create_index("quizId", unique=True)
    db.quiz_discussions.create_index("addedAt")
    db.discussion_messages.create_index("id", unique=True)
    db.discussion_messages.create_index("quizId")
    db.discussion_messages.create_index("timestamp")
    db.otp_codes.create_index("email", unique=True)
    db.otp_codes.create_index("expiresAt", expireAfterSeconds=0)  
    seed_admin_user()

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

def add_quiz_to_discussion(db: Database, data: dict) -> dict:
    """Add a quiz to discussions"""
    db.quiz_discussions.insert_one(data)
    return data

def get_quiz_discussions(db: Database, skip: int = 0, limit: int = 50) -> list:
    """Get all quizzes in discussions"""
    return list(db.quiz_discussions.find().sort("addedAt", -1).skip(skip).limit(limit))

def count_quiz_discussions(db: Database) -> int:
    """Count total quiz discussions"""
    return db.quiz_discussions.count_documents({})

def get_quiz_discussion_by_quiz_id(db: Database, quiz_id: str) -> dict:
    """Get a specific quiz discussion by quiz ID"""
    return db.quiz_discussions.find_one({"quizId": quiz_id})

def remove_quiz_from_discussion(db: Database, quiz_id: str) -> bool:
    """Remove a quiz from discussions"""
    result = db.quiz_discussions.delete_one({"quizId": quiz_id})
    return result.deleted_count > 0

def create_discussion_message(db: Database, data: dict) -> dict:
    """Create a new discussion message"""
    db.discussion_messages.insert_one(data)
    return data

def get_discussion_messages(db: Database, quiz_id: str, skip: int = 0, limit: int = 100) -> list:
    """Get discussion messages for a quiz"""
    return list(db.discussion_messages.find({"quizId": quiz_id}).sort("timestamp", 1).skip(skip).limit(limit))

def delete_discussion_messages_by_quiz(db: Database, quiz_id: str) -> int:
    """Delete all discussion messages for a quiz"""
    result = db.discussion_messages.delete_many({"quizId": quiz_id})
    return result.deleted_count

def create_otp(db: Database, email: str, otp: str, expires_at) -> dict:
    """Create or update OTP for an email"""

    data = {
        "email": email,
        "otp": otp,
        "expiresAt": expires_at,
        "createdAt": datetime.now()
    }

    db.otp_codes.update_one(
        {"email": email},
        {"$set": data},
        upsert=True
    )
    return data


def verify_otp(db: Database, email: str, otp: str) -> bool:
    """Verify OTP for an email. Returns True if valid and not expired."""
    from datetime import datetime
    record = db.otp_codes.find_one({
        "email": email,
        "otp": otp,
        "expiresAt": {"$gt": datetime.now()}
    })
    return record is not None


def delete_otp(db: Database, email: str) -> bool:
    """Delete OTP after successful verification"""
    result = db.otp_codes.delete_one({"email": email})
    return result.deleted_count > 0

def get_user_settings(db: Database, user_id: str) -> dict:
    """Get user settings"""
    settings = db.user_settings.find_one({"userId": user_id})
    return settings

def save_user_settings(db: Database, user_id: str, settings: dict) -> dict:
    """Save or update user settings"""
    data = {
        "userId": user_id,
        **settings,
        "updatedAt": datetime.now().isoformat()
    }
    db.user_settings.update_one(
        {"userId": user_id},
        {"$set": data},
        upsert=True
    )
    return data

def get_system_settings(db: Database) -> dict:
    """Get system settings"""
    settings = db.system_settings.find_one({"_id": "system"})
    return settings or {}

def save_system_settings(db: Database, settings: dict) -> dict:
    """Save or update system settings"""
    data = {
        "_id": "system",
        **settings,
        "updatedAt": datetime.now().isoformat()
    }
    db.system_settings.update_one(
        {"_id": "system"},
        {"$set": data},
        upsert=True
    )
    return data