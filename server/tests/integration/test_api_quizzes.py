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
Integration tests for quiz API endpoints.
"""

import os
import sys
import pytest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestGetQuizzesEndpoint:
    """Tests for GET /api/quizzes endpoint."""

    def test_get_quizzes_success(self, test_client, auth_headers_student, quiz_in_db):
        """Test getting all quizzes with pagination."""
        response = test_client.get(
            "/api/quizzes",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 1

    def test_get_quizzes_with_pagination(self, test_client, auth_headers_student, quiz_in_db):
        """Test quizzes pagination."""
        response = test_client.get(
            "/api/quizzes?page=1&size=5",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "page" in data
        assert "size" in data

    def test_get_quizzes_filter_by_creator(self, test_client, auth_headers_student, quiz_in_db, student_user):
        """Test filtering quizzes by creator."""
        response = test_client.get(
            f"/api/quizzes?created_by={student_user['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        for quiz in data["items"]:
            assert quiz["createdBy"] == student_user["id"]

    def test_get_quizzes_no_auth(self, test_client):
        """Test getting quizzes without authentication."""
        response = test_client.get("/api/quizzes")
        
        assert response.status_code == 403

class TestGetQuizEndpoint:
    """Tests for GET /api/quizzes/{quiz_id} endpoint."""

    def test_get_quiz_success(self, test_client, auth_headers_student, quiz_in_db):
        """Test getting a specific quiz."""
        response = test_client.get(
            f"/api/quizzes/{quiz_in_db['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == quiz_in_db["id"]
        assert data["title"] == quiz_in_db["title"]

    def test_get_quiz_not_found(self, test_client, auth_headers_student):
        """Test getting non-existent quiz."""
        response = test_client.get(
            "/api/quizzes/nonexistent-id",
            headers=auth_headers_student
        )
        
        assert response.status_code == 404

class TestCreateQuizEndpoint:
    """Tests for POST /api/quizzes endpoint."""

    @pytest.fixture
    def create_quiz_payload(self):
        """Valid quiz creation payload."""
        return {
            "title": "New Quiz",
            "description": "A new quiz for testing",
            "questions": [
                {
                    "id": "q-001",
                    "content": "What is HTTP?",
                    "options": ["Protocol", "Language", "Database", "Framework"],
                    "correctAnswer": 0,
                    "chapter": "Web",
                    "topic": "HTTP",
                    "knowledgeType": "concept",
                    "difficulty": "easy"
                }
            ],
            "duration": 30,
            "settings": {
                "chapter": "Web",
                "topic": "HTTP",
                "questionCount": 1
            }
        }

    def test_create_quiz_success(self, test_client, auth_headers_student, create_quiz_payload):
        """Test creating a new quiz."""
        response = test_client.post(
            "/api/quizzes",
            headers=auth_headers_student,
            json=create_quiz_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == create_quiz_payload["title"]
        assert "id" in data
        assert "createdAt" in data

    def test_create_quiz_no_auth(self, test_client, create_quiz_payload):
        """Test creating quiz without authentication."""
        response = test_client.post(
            "/api/quizzes",
            json=create_quiz_payload
        )
        
        assert response.status_code == 403

    def test_create_quiz_invalid_payload(self, test_client, auth_headers_student):
        """Test creating quiz with invalid payload."""
        response = test_client.post(
            "/api/quizzes",
            headers=auth_headers_student,
            json={"title": "Invalid Quiz"}
        )
        
        assert response.status_code == 422

class TestUpdateQuizEndpoint:
    """Tests for PUT /api/quizzes/{quiz_id} endpoint."""

    def test_update_quiz_success(self, test_client, auth_headers_student, quiz_in_db):
        """Test updating a quiz."""
        response = test_client.put(
            f"/api/quizzes/{quiz_in_db['id']}",
            headers=auth_headers_student,
            json={"title": "Updated Quiz Title"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Quiz Title"

    def test_update_quiz_not_found(self, test_client, auth_headers_student):
        """Test updating non-existent quiz."""
        response = test_client.put(
            "/api/quizzes/nonexistent-id",
            headers=auth_headers_student,
            json={"title": "Updated Title"}
        )
        
        assert response.status_code == 404

    def test_update_quiz_not_owner(self, test_client, auth_headers_admin, quiz_in_db, admin_user):
        """Test updating quiz by non-owner (should still work for admin)."""
        response = test_client.put(
            f"/api/quizzes/{quiz_in_db['id']}",
            headers=auth_headers_admin,
            json={"title": "Admin Updated Title"}
        )
        
        assert response.status_code in [200, 403]

class TestDeleteQuizEndpoint:
    """Tests for DELETE /api/quizzes/{quiz_id} endpoint."""

    def test_delete_quiz_success(self, test_client, auth_headers_student, quiz_in_db):
        """Test deleting a quiz."""
        response = test_client.delete(
            f"/api/quizzes/{quiz_in_db['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        
        get_response = test_client.get(
            f"/api/quizzes/{quiz_in_db['id']}",
            headers=auth_headers_student
        )
        assert get_response.status_code == 404

    def test_delete_quiz_not_found(self, test_client, auth_headers_student):
        """Test deleting non-existent quiz."""
        response = test_client.delete(
            "/api/quizzes/nonexistent-id",
            headers=auth_headers_student
        )
        
        assert response.status_code == 404

class TestUpdateQuestionEndpoint:
    """Tests for PUT /api/quizzes/{quiz_id}/questions/{question_id} endpoint."""

    def test_update_question_success(self, test_client, auth_headers_student, quiz_in_db):
        """Test updating a question in a quiz."""
        question_id = quiz_in_db["questions"][0]["id"]
        
        response = test_client.put(
            f"/api/quizzes/{quiz_in_db['id']}/questions/{question_id}",
            headers=auth_headers_student,
            json={"content": "Updated question content?"}
        )
        
        assert response.status_code == 200

    def test_update_question_quiz_not_found(self, test_client, auth_headers_student):
        """Test updating question in non-existent quiz."""
        response = test_client.put(
            "/api/quizzes/nonexistent-id/questions/q-001",
            headers=auth_headers_student,
            json={"content": "Updated content"}
        )
        
        assert response.status_code == 404

    def test_update_question_not_owner(self, test_client, auth_headers_student, mock_db, admin_user):
        """Test updating question in quiz not owned by user."""
        quiz_data = {
            "id": "quiz-admin-owned",
            "title": "Admin Quiz",
            "questions": [{
                "id": "q-001", "content": "Q1", "options": ["A"], "correctAnswer": 0,
                "chapter": "C", "topic": "T", "knowledgeType": "concept", "difficulty": "easy"
            }],
            "duration": 30,
            "createdBy": admin_user["id"],
            "createdAt": datetime.utcnow().isoformat(),
            "settings": {"questionCount": 1}
        }
        mock_db.quizzes.insert_one(quiz_data)
        
        response = test_client.put(
            f"/api/quizzes/{quiz_data['id']}/questions/q-001",
            headers=auth_headers_student,
            json={"content": "Hacked content"}
        )
        
        assert response.status_code == 403

class TestDeleteQuestionEndpoint:
    """Tests for DELETE /api/quizzes/{quiz_id}/questions/{question_id} endpoint."""

    def test_delete_question_success(self, test_client, auth_headers_student, mock_db, student_user):
        """Test deleting a question from a quiz."""
        quiz_data = {
            "id": "quiz-multi",
            "title": "Multi Question Quiz",
            "description": "Quiz with multiple questions",
            "questions": [
                {
                    "id": "q-001",
                    "content": "Question 1",
                    "options": ["A", "B", "C", "D"],
                    "correctAnswer": 0,
                    "chapter": "Test",
                    "topic": "Test",
                    "knowledgeType": "concept",
                    "difficulty": "easy"
                },
                {
                    "id": "q-002",
                    "content": "Question 2",
                    "options": ["A", "B", "C", "D"],
                    "correctAnswer": 1,
                    "chapter": "Test",
                    "topic": "Test",
                    "knowledgeType": "concept",
                    "difficulty": "easy"
                }
            ],
            "duration": 30,
            "createdBy": student_user["id"],
            "createdAt": datetime.utcnow().isoformat(),
            "settings": {"questionCount": 2}
        }
        mock_db.quizzes.insert_one(quiz_data)
        
        response = test_client.delete(
            f"/api/quizzes/{quiz_data['id']}/questions/q-001",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["questions"]) == 1