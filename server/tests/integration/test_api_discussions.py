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
Integration tests for discussion API endpoints.
"""

import os
import sys
import pytest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestAddToDiscussionEndpoint:
    """Tests for POST /api/discussions endpoint."""

    def test_add_quiz_to_discussion(self, test_client, auth_headers_student, quiz_in_db):
        """Test adding a quiz to discussion."""
        response = test_client.post(
            "/api/discussions",
            headers=auth_headers_student,
            json={"quizId": quiz_in_db["id"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quizId"] == quiz_in_db["id"]
        assert "id" in data
        assert "addedAt" in data

    def test_add_quiz_not_found(self, test_client, auth_headers_student):
        """Test adding non-existent quiz to discussion."""
        response = test_client.post(
            "/api/discussions",
            headers=auth_headers_student,
            json={"quizId": "nonexistent-quiz"}
        )
        
        assert response.status_code == 404

    def test_add_quiz_already_in_discussion(self, test_client, auth_headers_student, quiz_in_db, mock_db, sample_student_data):
        """Test adding quiz that's already in discussion."""

        mock_db.quiz_discussions.insert_one({
            "id": "discussion-001",
            "quizId": quiz_in_db["id"],
            "quizTitle": quiz_in_db["title"],
            "addedBy": sample_student_data["id"],
            "addedByName": sample_student_data["name"],
            "addedAt": datetime.utcnow().isoformat(),
            "messageCount": 0
        })
        
        response = test_client.post(
            "/api/discussions",
            headers=auth_headers_student,
            json={"quizId": quiz_in_db["id"]}
        )
        
        assert response.status_code == 400

    def test_add_quiz_no_auth(self, test_client, quiz_in_db):
        """Test adding quiz without authentication."""
        response = test_client.post(
            "/api/discussions",
            json={"quizId": quiz_in_db["id"]}
        )
        
        assert response.status_code == 403

class TestGetDiscussionsEndpoint:
    """Tests for GET /api/discussions endpoint."""

    def test_get_discussions(self, test_client, auth_headers_student, mock_db, sample_student_data, quiz_in_db):
        """Test getting all discussions."""

        mock_db.quiz_discussions.insert_one({
            "id": "discussion-001",
            "quizId": quiz_in_db["id"],
            "quizTitle": quiz_in_db["title"],
            "addedBy": sample_student_data["id"],
            "addedByName": sample_student_data["name"],
            "addedAt": datetime.utcnow().isoformat(),
            "messageCount": 0
        })
        
        response = test_client.get(
            "/api/discussions",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 1

    def test_get_discussions_with_pagination(self, test_client, auth_headers_student):
        """Test discussions pagination."""
        response = test_client.get(
            "/api/discussions?page=1&size=10",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200

class TestGetDiscussionByQuizEndpoint:
    """Tests for GET /api/discussions/{quiz_id} endpoint."""

    def test_get_discussion_by_quiz(self, test_client, auth_headers_student, mock_db, sample_student_data, quiz_in_db):
        """Test getting discussion by quiz ID."""
        mock_db.quiz_discussions.insert_one({
            "id": "discussion-001",
            "quizId": quiz_in_db["id"],
            "quizTitle": quiz_in_db["title"],
            "addedBy": sample_student_data["id"],
            "addedByName": sample_student_data["name"],
            "addedAt": datetime.utcnow().isoformat(),
            "messageCount": 0
        })
        
        response = test_client.get(
            f"/api/discussions/{quiz_in_db['id']}/quiz",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == quiz_in_db["id"]

    def test_get_discussion_not_found(self, test_client, auth_headers_student):
        """Test getting non-existent discussion."""
        response = test_client.get(
            "/api/discussions/nonexistent-quiz/quiz",
            headers=auth_headers_student
        )
        
        assert response.status_code == 404

class TestRemoveFromDiscussionEndpoint:
    """Tests for DELETE /api/discussions/{quiz_id} endpoint."""

    def test_remove_from_discussion(self, test_client, auth_headers_student, mock_db, sample_student_data, quiz_in_db):
        """Test removing quiz from discussion."""
        mock_db.quiz_discussions.insert_one({
            "id": "discussion-001",
            "quizId": quiz_in_db["id"],
            "quizTitle": quiz_in_db["title"],
            "addedBy": sample_student_data["id"],
            "addedByName": sample_student_data["name"],
            "addedAt": datetime.utcnow().isoformat(),
            "messageCount": 0
        })
        
        response = test_client.delete(
            f"/api/discussions/{quiz_in_db['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200

    def test_remove_from_discussion_not_found(self, test_client, auth_headers_student):
        """Test removing non-existent discussion."""
        response = test_client.delete(
            "/api/discussions/nonexistent-quiz",
            headers=auth_headers_student
        )
        
        assert response.status_code == 404

class TestDiscussionMessagesEndpoint:
    """Tests for discussion messages endpoints."""

    @pytest.fixture
    def discussion_in_db(self, mock_db, sample_student_data, quiz_in_db):
        """Create a discussion in database."""
        discussion = {
            "id": "discussion-001",
            "quizId": quiz_in_db["id"],
            "quizTitle": quiz_in_db["title"],
            "addedBy": sample_student_data["id"],
            "addedByName": sample_student_data["name"],
            "addedAt": datetime.utcnow().isoformat(),
            "messageCount": 0
        }
        mock_db.quiz_discussions.insert_one(discussion)
        return discussion

    def test_get_discussion_messages(self, test_client, auth_headers_student, mock_db, discussion_in_db, quiz_in_db, sample_student_data):
        """Test getting messages for a discussion."""

        mock_db.discussion_messages.insert_one({
            "id": "message-001",
            "quizId": quiz_in_db["id"],
            "userId": sample_student_data["id"],
            "userName": sample_student_data["name"],
            "content": "First message",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        response = test_client.get(
            f"/api/discussions/{quiz_in_db['id']}/messages",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_discussion_messages_empty(self, test_client, auth_headers_student, discussion_in_db, quiz_in_db):
        """Test getting messages for discussion with no messages."""
        response = test_client.get(
            f"/api/discussions/{quiz_in_db['id']}/messages",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestGetDiscussionOnlineUsersEndpoint:
    """Tests for GET /api/discussions/{quiz_id}/online endpoint."""

    def test_get_online_users(self, test_client, auth_headers_student, mock_db, quiz_in_db):
        """Test getting online users in discussion."""
        response = test_client.get(
            f"/api/discussions/{quiz_in_db['id']}/online",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)
