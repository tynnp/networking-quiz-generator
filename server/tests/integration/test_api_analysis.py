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
Integration tests for AI analysis API endpoints.
Tests with mocked Gemini API responses.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestGenerateQuestionsEndpoint:
    """Tests for POST /api/generate-questions endpoint."""

    @pytest.fixture
    def generate_questions_payload(self):
        """Valid generate questions payload."""
        return {
            "chapter": "Network Fundamentals",
            "topics": ["OSI Model"],
            "knowledgeTypes": ["concept"],
            "difficulty": "medium",
            "count": 5
        }

    @patch("main.get_gemini_client_for_user")
    def test_generate_questions_success(self, mock_get_client, test_client, auth_headers_student, generate_questions_payload):
        """Test successful question generation."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '''```json
[
    {
        "content": "What is the OSI model?",
        "options": ["Model A", "Model B", "Model C", "Model D"],
        "correctAnswer": 0,
        "difficulty": "medium",
        "explanation": "Standard model"
    }
]
```'''
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = (mock_client, "gemini-2.5-flash")

        response = test_client.post(
            "/api/generate-questions",
            headers=auth_headers_student,
            json=generate_questions_payload
        )

        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) == 1
        assert data["questions"][0]["content"] == "What is the OSI model?"

class TestAnalyzeResultEndpoint:
    """Tests for POST /api/analyze endpoint."""

    @pytest.fixture
    def analyze_request_payload(self, sample_question):
        """Valid analyze request payload."""
        return {
            "quizTitle": "Test Quiz",
            "questions": [sample_question],
            "answers": {"q-001": 0},
            "score": 100.0,
            "timeSpent": 60
        }

    @patch("main.get_gemini_client_for_user")
    def test_analyze_result_success(self, mock_get_client, test_client, auth_headers_student, analyze_request_payload):
        """Test successful result analysis."""

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '''```json
{
    "overallFeedback": "Excellent performance!",
    "strengths": ["OSI Model understanding"],
    "weaknesses": [],
    "suggestedTopics": ["TCP/IP"],
    "suggestedNextActions": ["Continue learning"]
}
```'''
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = (mock_client, "gemini-2.5-flash")
        
        response = test_client.post(
            "/api/analyze-result",
            headers=auth_headers_student,
            json=analyze_request_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "overallFeedback" in data
        assert "strengths" in data
        assert "weaknesses" in data

    def test_analyze_result_no_auth(self, test_client, analyze_request_payload):
        """Test analysis without authentication."""
        response = test_client.post(
            "/api/analyze-result",
            json=analyze_request_payload
        )
        
        assert response.status_code == 403

class TestAnalyzeOverallEndpoint:
    """Tests for POST /api/analyze/overall endpoint."""

    @pytest.fixture
    def analyze_overall_payload(self):
        """Valid overall analysis request payload."""
        return {
            "studentName": "Test Student",
            "attemptCount": 5,
            "avgScore": 75.5,
            "knowledgeAnalysis": [
                {
                    "knowledgeType": "concept",
                    "chapter": "Network Fundamentals",
                    "topic": "OSI Model",
                    "totalQuestions": 10,
                    "correctAnswers": 8,
                    "accuracy": 80.0
                }
            ]
        }

    @patch("main.get_gemini_client_for_user")
    def test_analyze_overall_success(self, mock_get_client, test_client, auth_headers_student, analyze_overall_payload):
        """Test successful overall analysis."""

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '''```json
{
    "overallFeedback": "Good overall performance!",
    "strengths": ["Consistent study habits"],
    "weaknesses": ["Time management"],
    "suggestedTopics": ["Advanced networking"],
    "suggestedNextActions": ["Practice more quizzes"]
}
```'''
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = (mock_client, "gemini-2.5-flash")
        
        response = test_client.post(
            "/api/analyze-overall",
            headers=auth_headers_student,
            json=analyze_overall_payload
        )
        
        assert response.status_code == 200

class TestAnalyzeProgressEndpoint:
    """Tests for POST /api/analyze/progress endpoint."""

    @pytest.fixture
    def analyze_progress_payload(self):
        """Valid progress analysis request payload."""
        return {
            "studentName": "Test Student",
            "chapter": "Network Fundamentals",
            "progressData": [
                {"date": "2024-01-01", "score": 60.0, "quizTitle": "Quiz 1"},
                {"date": "2024-01-05", "score": 70.0, "quizTitle": "Quiz 2"},
                {"date": "2024-01-10", "score": 80.0, "quizTitle": "Quiz 3"}
            ],
            "avgScore": 70.0,
            "trend": "improving"
        }

    @patch("main.get_gemini_client_for_user")
    def test_analyze_progress_success(self, mock_get_client, test_client, auth_headers_student, analyze_progress_payload):
        """Test successful progress analysis."""

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '''```json
{
    "overallFeedback": "Great progress over time!",
    "strengths": ["Consistent improvement"],
    "weaknesses": [],
    "suggestedTopics": ["Advanced topics"],
    "suggestedNextActions": ["Keep up the good work"]
}
```'''
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = (mock_client, "gemini-2.5-flash")
        
        response = test_client.post(
            "/api/analyze-progress",
            headers=auth_headers_student,
            json=analyze_progress_payload
        )
        
        assert response.status_code == 200

class TestAnalysisHistoryEndpoint:
    """Tests for GET /api/analysis/history endpoint."""

    def test_get_analysis_history(self, test_client, auth_headers_student, mock_db, sample_student_data):
        """Test getting analysis history."""

        mock_db.analysis_history.insert_one({
            "id": "history-001",
            "userId": sample_student_data["id"],
            "analysisType": "result",
            "title": "Test Analysis",
            "result": {
                "overallFeedback": "Good!",
                "strengths": [],
                "weaknesses": [],
                "suggestedTopics": [],
                "suggestedNextActions": []
            },
            "createdAt": datetime.utcnow().isoformat()
        })
        
        response = test_client.get(
            "/api/analysis-history",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_analysis_history_with_pagination(self, test_client, auth_headers_student):
        """Test analysis history pagination."""
        response = test_client.get(
            "/api/analysis-history?page=1&size=5",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200

class TestDeleteAnalysisHistoryEndpoint:
    """Tests for DELETE /api/analysis/history/{id} endpoint."""

    def test_delete_analysis_history(self, test_client, auth_headers_student, mock_db, sample_student_data):
        """Test deleting analysis history."""

        history_id = "history-to-delete"
        mock_db.analysis_history.insert_one({
            "id": history_id,
            "userId": sample_student_data["id"],
            "analysisType": "result",
            "title": "Test Analysis",
            "result": {},
            "createdAt": datetime.utcnow().isoformat()
        })
        
        response = test_client.delete(
            f"/api/analysis-history/{history_id}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200

    def test_delete_analysis_history_not_found(self, test_client, auth_headers_student):
        """Test deleting non-existent analysis history."""
        response = test_client.delete(
            "/api/analysis-history/nonexistent-id",
            headers=auth_headers_student
        )
        
        assert response.status_code == 404

