from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
import bcrypt
from pymongo.database import Database
import os
import uuid

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class UserInToken(BaseModel):
    id: str
    email: str
    role: str

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInToken:

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UserInToken(id="123", email="test@example.com", role="student")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_user_by_email(db: Database, email: str) -> Optional[dict]:
    return db.users.find_one({"email": email})

def get_user_by_id(db: Database, user_id: str) -> Optional[dict]:
    return db.users.find_one({"id": user_id})

def create_user(db: Database, email: str, password: str, name: str, role: str = "student") -> dict:
    hashed_password = get_password_hash(password)
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "hashed_password": hashed_password,
        "role": role,
        "isLocked": False
    }
    db.users.insert_one(user)
    return user

def get_all_users(db: Database) -> List[dict]:
    """Get all users"""
    return list(db.users.find({}, {"hashed_password": 0}))  # Exclude password

def delete_user(db: Database, user_id: str) -> bool:
    """Delete a user"""
    result = db.users.delete_one({"id": user_id})
    return result.deleted_count > 0

def lock_user(db: Database, user_id: str) -> bool:
    """Lock a user"""
    result = db.users.update_one(
        {"id": user_id},
        {"$set": {"isLocked": True}}
    )
    return result.modified_count > 0

def unlock_user(db: Database, user_id: str) -> bool:
    """Unlock a user"""
    result = db.users.update_one(
        {"id": user_id},
        {"$set": {"isLocked": False}}
    )
    return result.modified_count > 0

# Quiz functions
def create_quiz(db: Database, quiz_data: dict) -> dict:
    """Create a new quiz"""
    db.quizzes.insert_one(quiz_data)
    return quiz_data

def get_quiz_by_id(db: Database, quiz_id: str) -> Optional[dict]:
    """Get quiz by ID"""
    return db.quizzes.find_one({"id": quiz_id})

def get_all_quizzes(db: Database, created_by: Optional[str] = None) -> List[dict]:
    """Get all quizzes, optionally filtered by creator"""
    query = {} if not created_by else {"createdBy": created_by}
    return list(db.quizzes.find(query).sort("createdAt", -1))

def update_quiz(db: Database, quiz_id: str, updates: dict) -> Optional[dict]:
    """Update quiz information"""
    update_data = {k: v for k, v in updates.items() if v is not None and k != "id"}
    
    if not update_data:
        return get_quiz_by_id(db, quiz_id)
    
    result = db.quizzes.update_one(
        {"id": quiz_id},
        {"$set": update_data}
    )
    
    if result.modified_count > 0 or result.matched_count > 0:
        return get_quiz_by_id(db, quiz_id)
    return None

def delete_quiz(db: Database, quiz_id: str) -> bool:
    """Delete a quiz"""
    result = db.quizzes.delete_one({"id": quiz_id})
    return result.deleted_count > 0

def update_question_in_quiz(db: Database, quiz_id: str, question_id: str, updates: dict) -> Optional[dict]:
    """Update a question in a quiz"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        return None
    
    questions = quiz.get("questions", [])
    updated_questions = []
    found = False
    
    for q in questions:
        if q.get("id") == question_id:
            updated_questions.append({**q, **updates})
            found = True
        else:
            updated_questions.append(q)
    
    if not found:
        return None
    
    result = db.quizzes.update_one(
        {"id": quiz_id},
        {"$set": {"questions": updated_questions}}
    )
    
    if result.modified_count > 0:
        return get_quiz_by_id(db, quiz_id)
    return None

def delete_question_from_quiz(db: Database, quiz_id: str, question_id: str) -> Optional[dict]:
    """Delete a question from a quiz"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        return None
    
    questions = quiz.get("questions", [])
    updated_questions = [q for q in questions if q.get("id") != question_id]
    
    # Update questionCount in settings
    settings = quiz.get("settings", {})
    settings["questionCount"] = len(updated_questions)
    
    result = db.quizzes.update_one(
        {"id": quiz_id},
        {"$set": {"questions": updated_questions, "settings": settings}}
    )
    
    if result.modified_count > 0:
        return get_quiz_by_id(db, quiz_id)
    return None

# Attempt functions
def create_attempt(db: Database, attempt_data: dict) -> dict:
    """Create a new quiz attempt"""
    db.attempts.insert_one(attempt_data)
    return attempt_data

def get_attempt_by_id(db: Database, attempt_id: str) -> Optional[dict]:
    """Get attempt by ID"""
    return db.attempts.find_one({"id": attempt_id})

def get_attempts_by_student(db: Database, student_id: str) -> List[dict]:
    """Get all attempts by a student"""
    return list(db.attempts.find({"studentId": student_id}).sort("completedAt", -1))

def get_attempts_by_quiz(db: Database, quiz_id: str) -> List[dict]:
    """Get all attempts for a quiz"""
    return list(db.attempts.find({"quizId": quiz_id}).sort("completedAt", -1))

def update_user(db: Database, user_id: str, updates: dict) -> Optional[dict]:
    """Update user information"""
    # Remove None values and id from updates
    update_data = {k: v for k, v in updates.items() if v is not None and k != "id"}
    
    if not update_data:
        return get_user_by_id(db, user_id)
    
    result = db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count > 0 or result.matched_count > 0:
        return get_user_by_id(db, user_id)
    return None

def update_user_password(db: Database, user_id: str, new_password: str) -> bool:
    """Update user password"""
    hashed_password = get_password_hash(new_password)
    result = db.users.update_one(
        {"id": user_id},
        {"$set": {"hashed_password": hashed_password}}
    )
    return result.modified_count > 0
