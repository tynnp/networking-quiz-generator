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

"""
Shared fixtures for all tests.
"""

import os
import sys
import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
from typing import Generator

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mongomock
from fastapi.testclient import TestClient

# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture
def mock_mongo_client():
    """Create a mock MongoDB client using mongomock."""
    client = mongomock.MongoClient()
    return client

@pytest.fixture
def mock_db(mock_mongo_client):
    """Create a mock database instance."""
    db = mock_mongo_client["test_networking_quiz"]
    db.users.create_index("email", unique=True)
    db.users.create_index("id", unique=True)
    db.quizzes.create_index("id", unique=True)
    db.quizzes.create_index("createdBy")
    db.attempts.create_index("id", unique=True)
    db.analysis_history.create_index("id", unique=True)
    db.quiz_discussions.create_index("quizId", unique=True)
    db.otp_codes.create_index("email", unique=True)
    
    return db

@pytest.fixture
def test_client(mock_db):
    """Create a FastAPI test client with mocked database."""
    with patch("database.get_database", return_value=mock_db), \
         patch("database._db", mock_db), \
         patch("database.init_db"):
        from main import app
        from database import get_db
        
        def override_get_db():
            yield mock_db
        
        app.dependency_overrides[get_db] = override_get_db
        
        with TestClient(app) as client:
            yield client
        
        # Clean up
        app.dependency_overrides.clear()

# ============================================================================
# User Fixtures
# ============================================================================

@pytest.fixture
def sample_student_data():
    """Sample student user data."""
    return {
        "id": "student-123",
        "email": "student@example.com",
        "name": "Test Student",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.uQJlEFZ4L6HqXe",  # "password123"
        "role": "student",
        "isLocked": False
    }

@pytest.fixture
def sample_admin_data():
    """Sample admin user data."""
    return {
        "id": "admin-456",
        "email": "admin@example.com",
        "name": "Test Admin",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.uQJlEFZ4L6HqXe",  # "password123"
        "role": "admin",
        "isLocked": False
    }

@pytest.fixture
def student_user(mock_db, sample_student_data):
    """Create a student user in the mock database."""
    mock_db.users.insert_one(sample_student_data)
    return sample_student_data

@pytest.fixture
def admin_user(mock_db, sample_admin_data):
    """Create an admin user in the mock database."""
    mock_db.users.insert_one(sample_admin_data)
    return sample_admin_data

@pytest.fixture
def student_token(student_user):
    """Generate a valid JWT token for student user."""
    from auth import create_access_token
    return create_access_token({"sub": student_user["id"]})

@pytest.fixture
def admin_token(admin_user):
    """Generate a valid JWT token for admin user."""
    from auth import create_access_token
    return create_access_token({"sub": admin_user["id"]})

@pytest.fixture
def auth_headers_student(student_token):
    """Authorization headers for student user."""
    return {"Authorization": f"Bearer {student_token}"}

@pytest.fixture
def auth_headers_admin(admin_token):
    """Authorization headers for admin user."""
    return {"Authorization": f"Bearer {admin_token}"}

# ============================================================================
# Quiz Fixtures
# ============================================================================

@pytest.fixture
def sample_question():
    """Sample question data."""
    return {
        "id": "q-001",
        "content": "What is the OSI model?",
        "options": [
            "A 7-layer network model",
            "A programming language",
            "A database system",
            "An operating system"
        ],
        "correctAnswer": 0,
        "chapter": "Network Fundamentals",
        "topic": "OSI Model",
        "knowledgeType": "concept",
        "difficulty": "easy",
        "explanation": "The OSI model is a 7-layer conceptual model for network communication."
    }

@pytest.fixture
def sample_quiz_data(sample_question, sample_student_data):
    """Sample quiz data."""
    return {
        "id": "quiz-001",
        "title": "Test Quiz",
        "description": "A test quiz for unit testing",
        "questions": [sample_question],
        "duration": 30,
        "createdBy": sample_student_data["id"],
        "createdAt": datetime.utcnow().isoformat(),
        "settings": {
            "chapter": "Network Fundamentals",
            "topic": "OSI Model",
            "knowledgeTypes": ["concept"],
            "difficulty": "easy",
            "questionCount": 1
        }
    }

@pytest.fixture
def quiz_in_db(mock_db, sample_quiz_data):
    """Create a quiz in the mock database."""
    mock_db.quizzes.insert_one(sample_quiz_data.copy())
    return sample_quiz_data

# ============================================================================
# Attempt Fixtures
# ============================================================================

@pytest.fixture
def sample_attempt_data(sample_quiz_data, sample_student_data):
    """Sample attempt data."""
    return {
        "id": "attempt-001",
        "quizId": sample_quiz_data["id"],
        "studentId": sample_student_data["id"],
        "answers": {"q-001": 0},
        "score": 100.0,
        "completedAt": datetime.utcnow().isoformat(),
        "timeSpent": 120
    }

@pytest.fixture
def attempt_in_db(mock_db, sample_attempt_data, quiz_in_db, student_user):
    """Create an attempt in the mock database."""
    mock_db.attempts.insert_one(sample_attempt_data.copy())
    return sample_attempt_data

# ============================================================================
# Analysis Fixtures
# ============================================================================

@pytest.fixture
def sample_analysis_history(sample_student_data):
    """Sample analysis history data."""
    return {
        "id": "analysis-001",
        "userId": sample_student_data["id"],
        "analysisType": "result",
        "title": "Test Quiz Analysis",
        "result": {
            "overallFeedback": "Good performance!",
            "strengths": ["OSI Model understanding"],
            "weaknesses": [],
            "suggestedTopics": ["TCP/IP"],
            "suggestedNextActions": ["Practice more"]
        },
        "context": {"quizTitle": "Test Quiz"},
        "createdAt": datetime.utcnow().isoformat()
    }

# ============================================================================
# Mock External Services
# ============================================================================

@pytest.fixture
def mock_gemini_client():
    """Mock Gemini AI client."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"overallFeedback": "Good!", "strengths": [], "weaknesses": [], "suggestedTopics": [], "suggestedNextActions": []}'
    mock_client.models.generate_content.return_value = mock_response
    return mock_client

@pytest.fixture
def mock_smtp():
    """Mock SMTP server for email tests."""
    with patch("smtplib.SMTP") as mock:
        instance = mock.return_value.__enter__.return_value
        instance.sendmail.return_value = {}
        yield mock

# ============================================================================
# OTP Fixtures
# ============================================================================

@pytest.fixture
def sample_otp_data():
    """Sample OTP data."""
    return {
        "email": "test@example.com",
        "otp": "123456",
        "expiresAt": datetime.utcnow() + timedelta(minutes=10),
        "createdAt": datetime.utcnow()
    }

@pytest.fixture
def otp_in_db(mock_db, sample_otp_data):
    """Create an OTP record in the mock database."""
    mock_db.otp_codes.insert_one(sample_otp_data.copy())
    return sample_otp_data