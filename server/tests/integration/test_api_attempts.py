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
Integration tests for quiz attempt API endpoints.
"""

import os
import sys
import pytest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestCreateAttemptEndpoint:
    """Tests for POST /api/attempts endpoint."""

    def test_create_attempt_success(self, test_client, auth_headers_student, quiz_in_db):
        """Test creating a quiz attempt."""
        response = test_client.post(
            "/api/attempts",
            headers=auth_headers_student,
            json={
                "quizId": quiz_in_db["id"],
                "answers": {"q-001": 0},
                "score": 100.0,
                "timeSpent": 120
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quizId"] == quiz_in_db["id"]
        assert data["score"] == 100.0
        assert "id" in data
        assert "completedAt" in data

    def test_create_attempt_quiz_not_found(self, test_client, auth_headers_student):
        """Test creating attempt for non-existent quiz."""
        response = test_client.post(
            "/api/attempts",
            headers=auth_headers_student,
            json={
                "quizId": "nonexistent-quiz",
                "answers": {},
                "score": 0,
                "timeSpent": 60
            }
        )
        
        assert response.status_code == 404

    def test_create_attempt_no_auth(self, test_client, quiz_in_db):
        """Test creating attempt without authentication."""
        response = test_client.post(
            "/api/attempts",
            json={
                "quizId": quiz_in_db["id"],
                "answers": {},
                "score": 0,
                "timeSpent": 60
            }
        )
        
        assert response.status_code == 403

class TestGetAttemptsEndpoint:
    """Tests for GET /api/attempts endpoint."""

    def test_get_attempts_by_student(self, test_client, auth_headers_student, attempt_in_db):
        """Test getting attempts for current student."""
        response = test_client.get(
            "/api/attempts",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_attempts_filter_by_quiz(self, test_client, auth_headers_student, attempt_in_db, sample_quiz_data):
        """Test filtering attempts by quiz ID."""
        response = test_client.get(
            f"/api/attempts?quiz_id={sample_quiz_data['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        for attempt in data:
            assert attempt["quizId"] == sample_quiz_data["id"]

    def test_get_attempts_no_auth(self, test_client):
        """Test getting attempts without authentication."""
        response = test_client.get("/api/attempts")
        
        assert response.status_code == 403


class TestGetAttemptByIdEndpoint:
    """Tests for GET /api/attempts/{attempt_id} endpoint."""

    def test_get_attempt_by_id_success(self, test_client, auth_headers_student, attempt_in_db):
        """Test getting a specific attempt."""
        response = test_client.get(
            f"/api/attempts/{attempt_in_db['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == attempt_in_db["id"]

    def test_get_attempt_not_found(self, test_client, auth_headers_student):
        """Test getting non-existent attempt."""
        response = test_client.get(
            "/api/attempts/nonexistent-id",
            headers=auth_headers_student
        )
        
        assert response.status_code == 404

class TestAttemptStatistics:
    """Tests for attempt statistics and calculations."""

    def test_attempt_score_calculation(self, test_client, auth_headers_student, quiz_in_db):
        """Test that attempt stores correct score."""

        response = test_client.post(
            "/api/attempts",
            headers=auth_headers_student,
            json={
                "quizId": quiz_in_db["id"],
                "answers": {"q-001": 0},
                "score": 100.0,
                "timeSpent": 60
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 100.0

    def test_multiple_attempts_same_quiz(self, test_client, auth_headers_student, quiz_in_db):
        """Test creating multiple attempts for same quiz."""

        response1 = test_client.post(
            "/api/attempts",
            headers=auth_headers_student,
            json={
                "quizId": quiz_in_db["id"],
                "answers": {"q-001": 1},  # Wrong answer
                "score": 0.0,
                "timeSpent": 30
            }
        )
        assert response1.status_code == 200
        
        response2 = test_client.post(
            "/api/attempts",
            headers=auth_headers_student,
            json={
                "quizId": quiz_in_db["id"],
                "answers": {"q-001": 0},  # Correct answer
                "score": 100.0,
                "timeSpent": 45
            }
        )
        assert response2.status_code == 200
        
        attempts_response = test_client.get(
            f"/api/attempts?quiz_id={quiz_in_db['id']}",
            headers=auth_headers_student
        )
        assert attempts_response.status_code == 200
        attempts = attempts_response.json()
        assert len(attempts) >= 2