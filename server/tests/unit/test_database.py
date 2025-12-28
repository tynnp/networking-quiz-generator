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
Unit tests for database.py module.
Tests for database operations, analysis history, discussions, OTP, and settings.
"""

import os
import sys
import pytest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import (
    create_analysis_history,
    get_analysis_history_by_user,
    get_analysis_history_by_id,
    delete_analysis_history,
    add_quiz_to_discussion,
    get_quiz_discussions,
    count_quiz_discussions,
    get_quiz_discussion_by_quiz_id,
    remove_quiz_from_discussion,
    create_discussion_message,
    get_discussion_messages,
    delete_discussion_messages_by_quiz,
    create_otp,
    verify_otp,
    delete_otp,
    get_user_settings,
    save_user_settings,
    get_system_settings,
    save_system_settings,
)

class TestAnalysisHistory:
    """Tests for analysis history functions."""

    def test_create_analysis_history(self, mock_db, sample_analysis_history):
        """Test creating an analysis history record."""
        result = create_analysis_history(mock_db, sample_analysis_history)
        
        assert result is not None
        assert result["id"] == sample_analysis_history["id"]
        assert result["userId"] == sample_analysis_history["userId"]

    def test_get_analysis_history_by_user(self, mock_db, sample_analysis_history, sample_student_data):
        """Test getting analysis history for a user with pagination."""
        create_analysis_history(mock_db, sample_analysis_history)
        
        result = get_analysis_history_by_user(mock_db, sample_student_data["id"])
        
        assert "items" in result
        assert "total" in result
        assert result["total"] == 1
        assert len(result["items"]) == 1

    def test_get_analysis_history_by_user_pagination(self, mock_db, sample_student_data):
        """Test pagination for analysis history."""

        for i in range(5):
            data = {
                "id": f"analysis-{i}",
                "userId": sample_student_data["id"],
                "analysisType": "result",
                "title": f"Analysis {i}",
                "result": {},
                "createdAt": datetime.utcnow().isoformat()
            }
            create_analysis_history(mock_db, data)
        
        result = get_analysis_history_by_user(mock_db, sample_student_data["id"], skip=0, limit=2)
        
        assert result["total"] == 5
        assert len(result["items"]) == 2

    def test_get_analysis_history_by_id(self, mock_db, sample_analysis_history):
        """Test getting analysis history by ID."""
        create_analysis_history(mock_db, sample_analysis_history)
        
        result = get_analysis_history_by_id(mock_db, sample_analysis_history["id"])
        
        assert result is not None
        assert result["id"] == sample_analysis_history["id"]

    def test_get_analysis_history_by_id_not_found(self, mock_db):
        """Test getting non-existent analysis history."""
        result = get_analysis_history_by_id(mock_db, "nonexistent-id")
        
        assert result is None

    def test_delete_analysis_history(self, mock_db, sample_analysis_history, sample_student_data):
        """Test deleting analysis history."""
        create_analysis_history(mock_db, sample_analysis_history)
        
        result = delete_analysis_history(
            mock_db,
            sample_analysis_history["id"],
            sample_student_data["id"]
        )
        
        assert result is True
        assert get_analysis_history_by_id(mock_db, sample_analysis_history["id"]) is None

    def test_delete_analysis_history_wrong_user(self, mock_db, sample_analysis_history):
        """Test deleting analysis history with wrong user ID."""
        create_analysis_history(mock_db, sample_analysis_history)
        
        result = delete_analysis_history(mock_db, sample_analysis_history["id"], "wrong-user")
        
        assert result is False

class TestQuizDiscussions:
    """Tests for quiz discussion functions."""

    @pytest.fixture
    def sample_discussion_data(self, sample_student_data):
        """Sample discussion data."""
        return {
            "id": "discussion-001",
            "quizId": "quiz-001",
            "quizTitle": "Test Quiz",
            "addedBy": sample_student_data["id"],
            "addedByName": sample_student_data["name"],
            "addedAt": datetime.utcnow().isoformat(),
            "messageCount": 0
        }

    def test_add_quiz_to_discussion(self, mock_db, sample_discussion_data):
        """Test adding a quiz to discussion."""
        result = add_quiz_to_discussion(mock_db, sample_discussion_data)
        
        assert result is not None
        assert result["quizId"] == sample_discussion_data["quizId"]

    def test_get_quiz_discussions(self, mock_db, sample_discussion_data):
        """Test getting all quiz discussions."""
        add_quiz_to_discussion(mock_db, sample_discussion_data)
        
        result = get_quiz_discussions(mock_db)
        
        assert len(result) == 1
        assert result[0]["quizId"] == sample_discussion_data["quizId"]

    def test_count_quiz_discussions(self, mock_db, sample_discussion_data):
        """Test counting quiz discussions."""
        add_quiz_to_discussion(mock_db, sample_discussion_data)
        
        count = count_quiz_discussions(mock_db)
        
        assert count == 1

    def test_get_quiz_discussion_by_quiz_id(self, mock_db, sample_discussion_data):
        """Test getting discussion by quiz ID."""
        add_quiz_to_discussion(mock_db, sample_discussion_data)
        
        result = get_quiz_discussion_by_quiz_id(mock_db, sample_discussion_data["quizId"])
        
        assert result is not None
        assert result["quizId"] == sample_discussion_data["quizId"]

    def test_remove_quiz_from_discussion(self, mock_db, sample_discussion_data):
        """Test removing quiz from discussion."""
        add_quiz_to_discussion(mock_db, sample_discussion_data)
        
        result = remove_quiz_from_discussion(mock_db, sample_discussion_data["quizId"])
        
        assert result is True
        assert get_quiz_discussion_by_quiz_id(mock_db, sample_discussion_data["quizId"]) is None

class TestDiscussionMessages:
    """Tests for discussion message functions."""

    @pytest.fixture
    def sample_message_data(self, sample_student_data):
        """Sample discussion message data."""
        return {
            "id": "message-001",
            "quizId": "quiz-001",
            "userId": sample_student_data["id"],
            "userName": sample_student_data["name"],
            "content": "This is a test message",
            "timestamp": datetime.utcnow().isoformat()
        }

    def test_create_discussion_message(self, mock_db, sample_message_data):
        """Test creating a discussion message."""
        result = create_discussion_message(mock_db, sample_message_data)
        
        assert result is not None
        assert result["content"] == sample_message_data["content"]

    def test_get_discussion_messages(self, mock_db, sample_message_data):
        """Test getting discussion messages for a quiz."""
        create_discussion_message(mock_db, sample_message_data)
        
        messages = get_discussion_messages(mock_db, sample_message_data["quizId"])
        
        assert len(messages) == 1
        assert messages[0]["content"] == sample_message_data["content"]

    def test_get_discussion_messages_pagination(self, mock_db, sample_student_data):
        """Test pagination for discussion messages."""
        quiz_id = "quiz-001"
        for i in range(5):
            data = {
                "id": f"message-{i}",
                "quizId": quiz_id,
                "userId": sample_student_data["id"],
                "userName": sample_student_data["name"],
                "content": f"Message {i}",
                "timestamp": datetime.utcnow().isoformat()
            }
            create_discussion_message(mock_db, data)
        
        messages = get_discussion_messages(mock_db, quiz_id, skip=0, limit=2)
        
        assert len(messages) == 2

    def test_delete_discussion_messages_by_quiz(self, mock_db, sample_message_data):
        """Test deleting all messages for a quiz."""
        create_discussion_message(mock_db, sample_message_data)
        
        count = delete_discussion_messages_by_quiz(mock_db, sample_message_data["quizId"])
        
        assert count == 1
        messages = get_discussion_messages(mock_db, sample_message_data["quizId"])
        assert len(messages) == 0

class TestOTP:
    """Tests for OTP functions."""

    def test_create_otp(self, mock_db):
        """Test creating an OTP."""
        email = "test@example.com"
        otp = "123456"
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        result = create_otp(mock_db, email, otp, expires_at)
        
        assert result is not None
        assert result["email"] == email
        assert result["otp"] == otp

    def test_create_otp_update_existing(self, mock_db):
        """Test updating existing OTP for same email."""
        email = "test@example.com"
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        create_otp(mock_db, email, "111111", expires_at)
        create_otp(mock_db, email, "222222", expires_at)
        
        count = mock_db.otp_codes.count_documents({"email": email})
        assert count == 1
        
        record = mock_db.otp_codes.find_one({"email": email})
        assert record["otp"] == "222222"

    def test_verify_otp_valid(self, mock_db):
        """Test verifying a valid OTP."""
        email = "test@example.com"
        otp = "123456"
        expires_at = datetime.now() + timedelta(minutes=10)
        create_otp(mock_db, email, otp, expires_at)
        
        result = verify_otp(mock_db, email, otp)
        
        assert result is True

    def test_verify_otp_wrong_code(self, mock_db):
        """Test verifying wrong OTP code."""
        email = "test@example.com"
        otp = "123456"
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        create_otp(mock_db, email, otp, expires_at)
        
        result = verify_otp(mock_db, email, "wrong-otp")
        
        assert result is False

    def test_verify_otp_expired(self, mock_db):
        """Test verifying expired OTP."""
        email = "test@example.com"
        otp = "123456"
        expires_at = datetime.utcnow() - timedelta(minutes=10)
        
        create_otp(mock_db, email, otp, expires_at)
        
        result = verify_otp(mock_db, email, otp)
        
        assert result is False

    def test_delete_otp(self, mock_db):
        """Test deleting OTP."""
        email = "test@example.com"
        otp = "123456"
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        create_otp(mock_db, email, otp, expires_at)
        
        result = delete_otp(mock_db, email)
        
        assert result is True
        record = mock_db.otp_codes.find_one({"email": email})
        assert record is None

class TestUserSettings:
    """Tests for user settings functions."""

    def test_save_user_settings(self, mock_db, sample_student_data):
        """Test saving user settings."""
        settings = {"theme": "dark", "notifications": True}
        
        result = save_user_settings(mock_db, sample_student_data["id"], settings)
        
        assert result is not None
        assert result["theme"] == "dark"
        assert result["notifications"] is True
        assert "updatedAt" in result

    def test_get_user_settings(self, mock_db, sample_student_data):
        """Test getting user settings."""
        settings = {"theme": "dark"}
        save_user_settings(mock_db, sample_student_data["id"], settings)
        
        result = get_user_settings(mock_db, sample_student_data["id"])
        
        assert result is not None
        assert result["theme"] == "dark"

    def test_get_user_settings_not_found(self, mock_db):
        """Test getting settings for user without settings."""
        result = get_user_settings(mock_db, "nonexistent-user")
        
        assert result is None

    def test_update_user_settings(self, mock_db, sample_student_data):
        """Test updating existing user settings."""
        save_user_settings(mock_db, sample_student_data["id"], {"theme": "dark"})
        save_user_settings(mock_db, sample_student_data["id"], {"theme": "light"})
        
        result = get_user_settings(mock_db, sample_student_data["id"])
        
        assert result["theme"] == "light"

class TestSystemSettings:
    """Tests for system settings functions."""

    def test_save_system_settings(self, mock_db):
        """Test saving system settings."""
        settings = {"defaultKeyLocked": True}
        
        result = save_system_settings(mock_db, settings)
        
        assert result is not None
        assert result["defaultKeyLocked"] is True
        assert "updatedAt" in result

    def test_get_system_settings(self, mock_db):
        """Test getting system settings."""
        settings = {"defaultKeyLocked": True}
        save_system_settings(mock_db, settings)
        
        result = get_system_settings(mock_db)
        
        assert result["defaultKeyLocked"] is True

    def test_get_system_settings_empty(self, mock_db):
        """Test getting system settings when none exist."""
        result = get_system_settings(mock_db)
        
        assert result == {}

    def test_update_system_settings(self, mock_db):
        """Test updating system settings."""
        save_system_settings(mock_db, {"defaultKeyLocked": True})
        save_system_settings(mock_db, {"defaultKeyLocked": False})
        
        result = get_system_settings(mock_db)
        
        assert result["defaultKeyLocked"] is False