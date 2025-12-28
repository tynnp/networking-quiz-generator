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
Unit tests for dtos.py module.
Tests for Pydantic model validation.
"""

import os
import sys
import pytest
from pydantic import ValidationError

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dtos import (
    LoginRequest,
    RegisterRequest,
    SendOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    Question,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    AnalyzeResultRequest,
    AnalyzeResultResponse,
    KnowledgeAnalysisItem,
    AnalyzeOverallRequest,
    ProgressDataPoint,
    AnalyzeProgressRequest,
    QuizSettings,
    CreateQuizRequest,
    UpdateQuizRequest,
    QuizResponse,
    UpdateQuestionRequest,
    CreateAttemptRequest,
    AttemptResponse,
    UserResponse,
    CreateUserRequest,
    AuthResponse,
    PaginatedResponse,
    AddToDiscussionRequest,
    QuizDiscussionResponse,
    DiscussionMessageResponse,
    GeminiSettingsRequest,
    GeminiSettingsResponse,
    SystemSettingsResponse,
    LockDefaultKeyRequest,
)

class TestLoginRequest:
    """Tests for LoginRequest validation."""

    def test_valid_login_request(self):
        """Test creating a valid login request."""
        request = LoginRequest(email="test@example.com", password="password123")
        
        assert request.email == "test@example.com"
        assert request.password == "password123"

    def test_email_too_long(self):
        """Test email exceeding max length."""
        with pytest.raises(ValidationError):
            LoginRequest(email="a" * 101 + "@example.com", password="password123")

    def test_password_too_long(self):
        """Test password exceeding max length."""
        with pytest.raises(ValidationError):
            LoginRequest(email="test@example.com", password="a" * 129)

class TestRegisterRequest:
    """Tests for RegisterRequest validation."""

    def test_valid_register_request(self):
        """Test creating a valid register request."""
        request = RegisterRequest(
            email="test@example.com",
            password="password123",
            name="Test User",
            otp="123456"
        )
        
        assert request.email == "test@example.com"
        assert request.otp == "123456"

    def test_password_too_short(self):
        """Test password below min length."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@example.com",
                password="12345",
                name="Test User",
                otp="123456"
            )

    def test_otp_wrong_length(self):
        """Test OTP with wrong length."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@example.com",
                password="password123",
                name="Test User",
                otp="12345"
            )

class TestQuestion:
    """Tests for Question validation."""

    @pytest.fixture
    def valid_question_data(self):
        """Valid question data."""
        return {
            "id": "q-001",
            "content": "What is the OSI model?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "chapter": "Network Fundamentals",
            "topic": "OSI Model",
            "knowledgeType": "concept",
            "difficulty": "easy"
        }

    def test_valid_question(self, valid_question_data):
        """Test creating a valid question."""
        question = Question(**valid_question_data)
        
        assert question.id == "q-001"
        assert question.knowledgeType == "concept"
        assert question.difficulty == "easy"

    def test_question_with_explanation(self, valid_question_data):
        """Test question with optional explanation."""
        valid_question_data["explanation"] = "This is an explanation"
        question = Question(**valid_question_data)
        
        assert question.explanation == "This is an explanation"

    def test_invalid_knowledge_type(self, valid_question_data):
        """Test with invalid knowledge type."""
        valid_question_data["knowledgeType"] = "invalid_type"
        
        with pytest.raises(ValidationError):
            Question(**valid_question_data)

    def test_invalid_difficulty(self, valid_question_data):
        """Test with invalid difficulty."""
        valid_question_data["difficulty"] = "very_hard"
        
        with pytest.raises(ValidationError):
            Question(**valid_question_data)

    def test_content_too_long(self, valid_question_data):
        """Test content exceeding max length."""
        valid_question_data["content"] = "a" * 2001
        
        with pytest.raises(ValidationError):
            Question(**valid_question_data)

class TestGenerateQuestionsRequest:
    """Tests for GenerateQuestionsRequest validation."""

    def test_valid_request(self):
        """Test creating a valid request."""
        request = GenerateQuestionsRequest(count=10)
        
        assert request.count == 10

    def test_with_optional_fields(self):
        """Test with optional fields."""
        request = GenerateQuestionsRequest(
            chapter="Network Fundamentals",
            topics=["OSI Model", "TCP/IP"],
            knowledgeTypes=["concept", "rule"],
            difficulty="medium",
            count=5
        )
        
        assert request.chapter == "Network Fundamentals"
        assert len(request.topics) == 2

    def test_count_too_high(self):
        """Test count exceeding max value."""
        with pytest.raises(ValidationError):
            GenerateQuestionsRequest(count=51)

    def test_count_zero(self):
        """Test count of zero."""
        with pytest.raises(ValidationError):
            GenerateQuestionsRequest(count=0)

    def test_count_negative(self):
        """Test negative count."""
        with pytest.raises(ValidationError):
            GenerateQuestionsRequest(count=-1)

class TestQuizSettings:
    """Tests for QuizSettings validation."""

    def test_valid_quiz_settings(self):
        """Test creating valid quiz settings."""
        settings = QuizSettings(
            chapter="Network Fundamentals",
            topic="OSI Model",
            questionCount=10
        )
        
        assert settings.chapter == "Network Fundamentals"
        assert settings.questionCount == 10

    def test_minimal_settings(self):
        """Test with only required fields."""
        settings = QuizSettings(questionCount=5)
        
        assert settings.questionCount == 5
        assert settings.chapter is None

class TestCreateQuizRequest:
    """Tests for CreateQuizRequest validation."""

    @pytest.fixture
    def valid_question(self):
        """Valid question for quiz."""
        return Question(
            id="q-001",
            content="Test question?",
            options=["A", "B", "C", "D"],
            correctAnswer=0,
            chapter="Test",
            topic="Test",
            knowledgeType="concept",
            difficulty="easy"
        )

    def test_valid_create_quiz_request(self, valid_question):
        """Test creating a valid quiz request."""
        request = CreateQuizRequest(
            title="Test Quiz",
            questions=[valid_question],
            duration=30,
            settings=QuizSettings(questionCount=1)
        )
        
        assert request.title == "Test Quiz"
        assert request.duration == 30
        assert len(request.questions) == 1

    def test_title_too_long(self, valid_question):
        """Test title exceeding max length."""
        with pytest.raises(ValidationError):
            CreateQuizRequest(
                title="a" * 151,
                questions=[valid_question],
                duration=30,
                settings=QuizSettings(questionCount=1)
            )

    def test_duration_too_high(self, valid_question):
        """Test duration exceeding max value."""
        with pytest.raises(ValidationError):
            CreateQuizRequest(
                title="Test Quiz",
                questions=[valid_question],
                duration=601,  # Max is 600
                settings=QuizSettings(questionCount=1)
            )

    def test_duration_zero(self, valid_question):
        """Test duration of zero."""
        with pytest.raises(ValidationError):
            CreateQuizRequest(
                title="Test Quiz",
                questions=[valid_question],
                duration=0,
                settings=QuizSettings(questionCount=1)
            )

class TestUserResponse:
    """Tests for UserResponse validation."""

    def test_valid_user_response(self):
        """Test creating a valid user response."""
        response = UserResponse(
            id="user-123",
            email="test@example.com",
            name="Test User",
            role="student"
        )
        
        assert response.id == "user-123"
        assert response.role == "student"
        assert response.isLocked is False

    def test_admin_role(self):
        """Test admin role."""
        response = UserResponse(
            id="admin-123",
            email="admin@example.com",
            name="Admin User",
            role="admin"
        )
        
        assert response.role == "admin"

    def test_invalid_role(self):
        """Test invalid role."""
        with pytest.raises(ValidationError):
            UserResponse(
                id="user-123",
                email="test@example.com",
                name="Test User",
                role="superadmin"
            )

class TestCreateAttemptRequest:
    """Tests for CreateAttemptRequest validation."""

    def test_valid_attempt_request(self):
        """Test creating a valid attempt request."""
        request = CreateAttemptRequest(
            quizId="quiz-123",
            answers={"q-001": 0, "q-002": 1},
            score=85.5,
            timeSpent=120
        )
        
        assert request.quizId == "quiz-123"
        assert request.score == 85.5
        assert len(request.answers) == 2

class TestAnalyzeResultRequest:
    """Tests for AnalyzeResultRequest validation."""

    @pytest.fixture
    def valid_question(self):
        """Valid question for analysis."""
        return Question(
            id="q-001",
            content="Test question?",
            options=["A", "B", "C", "D"],
            correctAnswer=0,
            chapter="Test",
            topic="Test",
            knowledgeType="concept",
            difficulty="easy"
        )

    def test_valid_analyze_request(self, valid_question):
        """Test creating a valid analyze request."""
        request = AnalyzeResultRequest(
            quizTitle="Test Quiz",
            questions=[valid_question],
            answers={"q-001": 0},
            score=100.0,
            timeSpent=60
        )
        
        assert request.quizTitle == "Test Quiz"
        assert request.score == 100.0

class TestKnowledgeAnalysisItem:
    """Tests for KnowledgeAnalysisItem validation."""

    def test_valid_knowledge_analysis_item(self):
        """Test creating a valid knowledge analysis item."""
        item = KnowledgeAnalysisItem(
            knowledgeType="concept",
            chapter="Network Fundamentals",
            topic="OSI Model",
            totalQuestions=10,
            correctAnswers=8,
            accuracy=80.0
        )
        
        assert item.accuracy == 80.0

class TestPaginatedResponse:
    """Tests for PaginatedResponse validation."""

    def test_valid_paginated_response(self):
        """Test creating a valid paginated response."""
        response = PaginatedResponse[str](
            items=["item1", "item2"],
            total=10,
            page=1,
            size=2,
            pages=5
        )
        
        assert len(response.items) == 2
        assert response.total == 10
        assert response.pages == 5

class TestUpdateProfileRequest:
    """Tests for UpdateProfileRequest validation."""

    def test_valid_update_profile(self):
        """Test creating a valid update profile request."""
        request = UpdateProfileRequest(
            name="New Name",
            dob="1990-01-01",
            phone="0123456789"
        )
        
        assert request.name == "New Name"
        assert request.phone == "0123456789"

    def test_phone_too_long(self):
        """Test phone number exceeding max length."""
        with pytest.raises(ValidationError):
            UpdateProfileRequest(phone="01234567890")

class TestChangePasswordRequest:
    """Tests for ChangePasswordRequest validation."""

    def test_valid_change_password(self):
        """Test creating a valid change password request."""
        request = ChangePasswordRequest(
            current_password="oldpassword",
            new_password="newpassword123"
        )
        
        assert request.new_password == "newpassword123"

    def test_new_password_too_short(self):
        """Test new password below min length."""
        with pytest.raises(ValidationError):
            ChangePasswordRequest(
                current_password="oldpassword",
                new_password="12345"
            )

class TestGeminiSettings:
    """Tests for Gemini settings validation."""

    def test_valid_gemini_settings_request(self):
        """Test creating valid Gemini settings request."""
        request = GeminiSettingsRequest(
            model="gemini-2.5-flash",
            apiKey="test-api-key"
        )
        
        assert request.model == "gemini-2.5-flash"

    def test_gemini_settings_response(self):
        """Test Gemini settings response."""
        response = GeminiSettingsResponse(
            model="gemini-2.5-flash",
            apiKey="test-key"
        )
        
        assert response.model == "gemini-2.5-flash"

class TestDiscussionModels:
    """Tests for discussion-related models."""

    def test_add_to_discussion_request(self):
        """Test AddToDiscussionRequest validation."""
        request = AddToDiscussionRequest(quizId="quiz-123")
        
        assert request.quizId == "quiz-123"

    def test_quiz_discussion_response(self):
        """Test QuizDiscussionResponse validation."""
        response = QuizDiscussionResponse(
            id="discussion-123",
            quizId="quiz-123",
            quizTitle="Test Quiz",
            addedBy="user-123",
            addedByName="Test User",
            addedAt="2024-01-01T00:00:00",
            messageCount=5
        )
        
        assert response.quizId == "quiz-123"
        assert response.messageCount == 5

    def test_discussion_message_response(self):
        """Test DiscussionMessageResponse validation."""
        response = DiscussionMessageResponse(
            id="message-123",
            quizId="quiz-123",
            userId="user-123",
            userName="Test User",
            content="Test message",
            timestamp="2024-01-01T00:00:00"
        )
        
        assert response.content == "Test message"