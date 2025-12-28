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
Unit tests for auth.py module.
Tests for password hashing, JWT tokens, and user CRUD operations.
"""

import os
import sys
import pytest
from datetime import timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    get_user_by_email,
    get_user_by_id,
    create_user,
    get_all_users,
    delete_user,
    lock_user,
    unlock_user,
    create_quiz,
    get_quiz_by_id,
    get_all_quizzes,
    update_quiz,
    delete_quiz,
    update_question_in_quiz,
    delete_question_from_quiz,
    create_attempt,
    get_attempt_by_id,
    get_attempts_by_student,
    get_attempts_by_quiz,
    update_user,
    update_user_password,
)

class TestPasswordHashing:
    """Tests for password hashing functions."""

    def test_get_password_hash_returns_hashed_string(self):
        """Test that get_password_hash returns a bcrypt hash."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")

    def test_get_password_hash_different_for_same_password(self):
        """Test that hashing same password twice gives different results (salt)."""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2

    def test_verify_password_correct(self):
        """Test verifying correct password."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test verifying incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False

class TestJWTTokens:
    """Tests for JWT token functions."""

    def test_create_access_token_basic(self):
        """Test creating a basic access token."""
        data = {"sub": "user-123"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_expiry(self):
        """Test creating an access token with custom expiry."""
        data = {"sub": "user-123"}
        expires = timedelta(hours=1)
        token = create_access_token(data, expires_delta=expires)
        
        assert token is not None

    def test_verify_token_valid(self):
        """Test verifying a valid token."""
        data = {"sub": "user-123"}
        token = create_access_token(data)
        
        payload = verify_token(token)
        
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert "exp" in payload

    def test_verify_token_invalid(self):
        """Test verifying an invalid token."""
        invalid_token = "invalid.token.here"
        
        payload = verify_token(invalid_token)
        
        assert payload is None

    def test_verify_token_tampered(self):
        """Test verifying a tampered token."""
        data = {"sub": "user-123"}
        token = create_access_token(data)
        
        tampered_token = token[:-5] + "xxxxx"
        payload = verify_token(tampered_token)
        
        assert payload is None

class TestUserCRUD:
    """Tests for user CRUD operations."""

    def test_create_user(self, mock_db):
        """Test creating a new user."""
        user = create_user(
            mock_db,
            email="newuser@example.com",
            password="password123",
            name="New User"
        )
        
        assert user is not None
        assert user["email"] == "newuser@example.com"
        assert user["name"] == "New User"
        assert user["role"] == "student"
        assert user["isLocked"] is False
        assert "id" in user
        assert "hashed_password" in user

    def test_create_user_with_admin_role(self, mock_db):
        """Test creating an admin user."""
        user = create_user(
            mock_db,
            email="admin@example.com",
            password="password123",
            name="Admin User",
            role="admin"
        )
        
        assert user["role"] == "admin"

    def test_get_user_by_email(self, mock_db, student_user):
        """Test getting user by email."""
        user = get_user_by_email(mock_db, student_user["email"])
        
        assert user is not None
        assert user["email"] == student_user["email"]

    def test_get_user_by_email_not_found(self, mock_db):
        """Test getting non-existent user by email."""
        user = get_user_by_email(mock_db, "nonexistent@example.com")
        
        assert user is None

    def test_get_user_by_id(self, mock_db, student_user):
        """Test getting user by ID."""
        user = get_user_by_id(mock_db, student_user["id"])
        
        assert user is not None
        assert user["id"] == student_user["id"]

    def test_get_user_by_id_not_found(self, mock_db):
        """Test getting non-existent user by ID."""
        user = get_user_by_id(mock_db, "nonexistent-id")
        
        assert user is None

    def test_get_all_users(self, mock_db, student_user, admin_user):
        """Test getting all users."""
        users = get_all_users(mock_db)
        
        assert len(users) == 2
        for user in users:
            assert "hashed_password" not in user

    def test_delete_user(self, mock_db, student_user):
        """Test deleting a user."""
        result = delete_user(mock_db, student_user["id"])
        
        assert result is True
        assert get_user_by_id(mock_db, student_user["id"]) is None

    def test_delete_user_not_found(self, mock_db):
        """Test deleting non-existent user."""
        result = delete_user(mock_db, "nonexistent-id")
        
        assert result is False

    def test_lock_user(self, mock_db, student_user):
        """Test locking a user."""
        result = lock_user(mock_db, student_user["id"])
        
        assert result is True
        user = get_user_by_id(mock_db, student_user["id"])
        assert user["isLocked"] is True

    def test_unlock_user(self, mock_db, student_user):
        """Test unlocking a user."""
        lock_user(mock_db, student_user["id"])
        result = unlock_user(mock_db, student_user["id"])
        
        assert result is True
        user = get_user_by_id(mock_db, student_user["id"])
        assert user["isLocked"] is False

    def test_update_user(self, mock_db, student_user):
        """Test updating user information."""
        updates = {"name": "Updated Name", "phone": "0123456789"}
        result = update_user(mock_db, student_user["id"], updates)
        
        assert result is not None
        assert result["name"] == "Updated Name"
        assert result["phone"] == "0123456789"

    def test_update_user_password(self, mock_db, student_user):
        """Test updating user password."""
        new_password = "newpassword123"
        result = update_user_password(mock_db, student_user["id"], new_password)
        
        assert result is True
        user = get_user_by_id(mock_db, student_user["id"])
        assert verify_password(new_password, user["hashed_password"]) is True

class TestQuizCRUD:
    """Tests for quiz CRUD operations."""

    def test_create_quiz(self, mock_db, sample_quiz_data):
        """Test creating a quiz."""
        quiz = create_quiz(mock_db, sample_quiz_data)
        
        assert quiz is not None
        assert quiz["id"] == sample_quiz_data["id"]
        assert quiz["title"] == sample_quiz_data["title"]

    def test_get_quiz_by_id(self, mock_db, quiz_in_db):
        """Test getting quiz by ID."""
        quiz = get_quiz_by_id(mock_db, quiz_in_db["id"])
        
        assert quiz is not None
        assert quiz["id"] == quiz_in_db["id"]

    def test_get_quiz_by_id_not_found(self, mock_db):
        """Test getting non-existent quiz."""
        quiz = get_quiz_by_id(mock_db, "nonexistent-id")
        
        assert quiz is None

    def test_get_all_quizzes(self, mock_db, quiz_in_db):
        """Test getting all quizzes with pagination."""
        result = get_all_quizzes(mock_db)
        
        assert "items" in result
        assert "total" in result
        assert result["total"] == 1
        assert len(result["items"]) == 1

    def test_get_all_quizzes_filtered_by_creator(self, mock_db, quiz_in_db, student_user):
        """Test filtering quizzes by creator."""
        result = get_all_quizzes(mock_db, created_by=student_user["id"])
        
        assert result["total"] == 1
        
        result2 = get_all_quizzes(mock_db, created_by="other-user")
        assert result2["total"] == 0

    def test_update_quiz(self, mock_db, quiz_in_db):
        """Test updating a quiz."""
        updates = {"title": "Updated Quiz Title"}
        result = update_quiz(mock_db, quiz_in_db["id"], updates)
        
        assert result is not None
        assert result["title"] == "Updated Quiz Title"

    def test_delete_quiz(self, mock_db, quiz_in_db):
        """Test deleting a quiz."""
        result = delete_quiz(mock_db, quiz_in_db["id"])
        
        assert result is True
        assert get_quiz_by_id(mock_db, quiz_in_db["id"]) is None

    def test_update_question_in_quiz(self, mock_db, quiz_in_db):
        """Test updating a question in a quiz."""
        question_id = quiz_in_db["questions"][0]["id"]
        updates = {"content": "Updated question content"}
        
        result = update_question_in_quiz(mock_db, quiz_in_db["id"], question_id, updates)
        
        assert result is not None
        updated_question = next(q for q in result["questions"] if q["id"] == question_id)
        assert updated_question["content"] == "Updated question content"

    def test_delete_question_from_quiz(self, mock_db, quiz_in_db):
        """Test deleting a question from a quiz."""
        question_id = quiz_in_db["questions"][0]["id"]
        
        result = delete_question_from_quiz(mock_db, quiz_in_db["id"], question_id)
        
        assert result is not None
        assert len(result["questions"]) == 0
        assert result["settings"]["questionCount"] == 0

class TestAttemptCRUD:
    """Tests for attempt CRUD operations."""

    def test_create_attempt(self, mock_db, sample_attempt_data):
        """Test creating an attempt."""
        attempt = create_attempt(mock_db, sample_attempt_data)
        
        assert attempt is not None
        assert attempt["id"] == sample_attempt_data["id"]

    def test_get_attempt_by_id(self, mock_db, attempt_in_db):
        """Test getting attempt by ID."""
        attempt = get_attempt_by_id(mock_db, attempt_in_db["id"])
        
        assert attempt is not None
        assert attempt["id"] == attempt_in_db["id"]

    def test_get_attempts_by_student(self, mock_db, attempt_in_db, student_user):
        """Test getting attempts by student."""
        attempts = get_attempts_by_student(mock_db, student_user["id"])
        
        assert len(attempts) == 1
        assert attempts[0]["studentId"] == student_user["id"]

    def test_get_attempts_by_quiz(self, mock_db, attempt_in_db, sample_quiz_data):
        """Test getting attempts by quiz."""
        attempts = get_attempts_by_quiz(mock_db, sample_quiz_data["id"])
        
        assert len(attempts) == 1
        assert attempts[0]["quizId"] == sample_quiz_data["id"]