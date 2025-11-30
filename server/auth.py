from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from pymongo.database import Database
import os
import uuid

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Generate salt and hash password
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
        "role": role
    }
    db.users.insert_one(user)
    return user

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
