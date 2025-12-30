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
Integration tests for authentication API endpoints.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestLoginEndpoint:
    """Tests for POST /api/auth/login endpoint."""

    @patch("main.verify_password")
    def test_login_success(self, mock_verify, test_client, student_user):
        """Test successful login."""
        mock_verify.return_value = True
        
        response = test_client.post(
            "/api/auth/login",
            json={
                "email": student_user["email"],
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == student_user["email"]

    def test_login_wrong_password(self, test_client, student_user):
        """Test login with wrong password."""
        response = test_client.post(
            "/api/auth/login",
            json={
                "email": student_user["email"],
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401

    def test_login_user_not_found(self, test_client):
        """Test login with non-existent user."""
        response = test_client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401

    def test_login_locked_user(self, test_client, mock_db, student_user):
        """Test login with locked user account."""

        mock_db.users.update_one(
            {"id": student_user["id"]},
            {"$set": {"isLocked": True}}
        )
        
        response = test_client.post(
            "/api/auth/login",
            json={
                "email": student_user["email"],
                "password": "password123"
            }
        )
        
        assert response.status_code == 403

class TestGetMeEndpoint:
    """Tests for GET /api/auth/me endpoint."""

    def test_get_me_success(self, test_client, auth_headers_student, student_user):
        """Test getting current user info."""
        response = test_client.get(
            "/api/auth/me",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == student_user["email"]
        assert "hashed_password" not in data

    def test_get_me_no_token(self, test_client):
        """Test getting user info without token."""
        response = test_client.get("/api/auth/me")
        
        assert response.status_code == 403

    def test_get_me_invalid_token(self, test_client):
        """Test getting user info with invalid token."""
        response = test_client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401

class TestSendOTPEndpoint:
    """Tests for POST /api/auth/send-otp endpoint."""

    @patch("main.validate_email_address")
    @patch("main.send_otp_email")
    @patch("main.create_otp")
    def test_send_otp_success(self, mock_create_otp, mock_send_email, mock_validate, test_client):
        """Test sending OTP for registration."""
        mock_validate.return_value = (True, "")
        mock_send_email.return_value = True
        mock_create_otp.return_value = {"email": "new@example.com", "otp": "123456"}
        
        response = test_client.post(
            "/api/auth/send-otp",
            json={
                "email": "new@example.com",
                "name": "New User"
            }
        )
        
        assert response.status_code == 200

    def test_send_otp_existing_email(self, test_client, student_user):
        """Test sending OTP with already registered email."""
        response = test_client.post(
            "/api/auth/send-otp",
            json={
                "email": student_user["email"],
                "name": "Test User"
            }
        )
        
        assert response.status_code == 400

    def test_send_otp_invalid_domain(self, test_client):
        """Test sending OTP with email having non-existent domain."""
        response = test_client.post(
            "/api/auth/send-otp",
            json={
                "email": "test@invalid-domain-xyz-12345.com",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_send_otp_invalid_syntax(self, test_client):
        """Test sending OTP with invalid email syntax."""
        response = test_client.post(
            "/api/auth/send-otp",
            json={
                "email": "invalid-email-syntax",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @patch("main.validate_email_address")
    @patch("main.send_otp_email")
    def test_send_otp_email_send_failure(self, mock_send_email, mock_validate, test_client):
        """Test sending OTP when email sending fails."""
        mock_validate.return_value = (True, "")
        mock_send_email.return_value = False
        
        response = test_client.post(
            "/api/auth/send-otp",
            json={
                "email": "test@example.com",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

class TestRegisterEndpoint:
    """Tests for POST /api/auth/register endpoint."""

    def test_register_success(self, test_client, mock_db):
        """Test successful registration."""

        from datetime import datetime, timedelta
        mock_db.otp_codes.insert_one({
            "email": "newuser@example.com",
            "otp": "123456",
            "expiresAt": datetime.now() + timedelta(minutes=10)
        })
        
        response = test_client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "name": "New User",
                "otp": "123456"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "newuser@example.com"

    def test_register_invalid_otp(self, test_client, mock_db):
        """Test registration with invalid OTP."""
        response = test_client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "name": "New User",
                "otp": "000000"
            }
        )
        
        assert response.status_code == 400

    def test_register_existing_email(self, test_client, student_user, mock_db):
        """Test registration with existing email."""
        mock_db.otp_codes.insert_one({
            "email": student_user["email"],
            "otp": "123456",
            "expiresAt": datetime.now() + timedelta(minutes=10)
        })
        
        response = test_client.post(
            "/api/auth/register",
            json={
                "email": student_user["email"],
                "password": "password123",
                "name": "Test User",
                "otp": "123456"
            }
        )
        
        assert response.status_code == 400

class TestForgotPasswordEndpoint:
    """Tests for POST /api/auth/forgot-password endpoint."""

    @patch("main.send_reset_password_otp_email")
    @patch("main.create_otp")
    def test_forgot_password_success(self, mock_create_otp, mock_send_email, test_client, student_user):
        """Test forgot password with valid email."""
        mock_send_email.return_value = True
        mock_create_otp.return_value = {"email": student_user["email"], "otp": "123456"}
        
        response = test_client.post(
            "/api/auth/forgot-password",
            json={"email": student_user["email"]}
        )
        
        assert response.status_code == 200

    def test_forgot_password_user_not_found(self, test_client):
        """Test forgot password with non-existent email."""
        response = test_client.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        
        # For security reasons, we return 200 even if user not found
        assert response.status_code == 200

class TestResetPasswordEndpoint:
    """Tests for POST /api/auth/reset-password endpoint."""

    @patch("main.send_password_changed_email")
    def test_reset_password_success(self, mock_send_email, test_client, mock_db, student_user):
        """Test successful password reset."""
        mock_send_email.return_value = True
        
        mock_db.otp_codes.insert_one({
            "email": student_user["email"],
            "otp": "123456",
            "expiresAt": datetime.now() + timedelta(minutes=10)
        })
        
        response = test_client.post(
            "/api/auth/reset-password",
            json={
                "email": student_user["email"],
                "otp": "123456",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == 200
        mock_send_email.assert_called_once()

    def test_reset_password_invalid_otp(self, test_client, student_user):
        """Test password reset with invalid OTP."""
        response = test_client.post(
            "/api/auth/reset-password",
            json={
                "email": student_user["email"],
                "otp": "000000",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == 400

    def test_reset_password_user_not_found(self, test_client):
        """Test password reset with non-existent email."""
        response = test_client.post(
            "/api/auth/reset-password",
            json={
                "email": "nonexistent@example.com",
                "otp": "123456",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == 400

class TestUpdateProfileEndpoint:
    """Tests for PUT /api/auth/profile endpoint."""

    def test_update_profile_success(self, test_client, auth_headers_student):
        """Test successful profile update."""
        response = test_client.put(
            "/api/auth/profile",
            headers=auth_headers_student,
            json={
                "name": "Updated Name",
                "phone": "0123456789"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_update_profile_no_auth(self, test_client):
        """Test profile update without authentication."""
        response = test_client.put(
            "/api/auth/profile",
            json={"name": "New Name"}
        )
        
        assert response.status_code == 403

class TestChangePasswordEndpoint:
    """Tests for POST /api/auth/change-password endpoint."""

    @patch("main.send_password_changed_email")
    @patch("main.verify_password")
    def test_change_password_success(self, mock_verify, mock_send_email, test_client, auth_headers_student):
        """Test successful password change."""
        mock_verify.return_value = True
        mock_send_email.return_value = True
        
        response = test_client.put(
            "/api/auth/change-password",
            headers=auth_headers_student,
            json={
                "current_password": "password123",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == 200
        mock_send_email.assert_called_once()

    def test_change_password_wrong_current(self, test_client, auth_headers_student):
        """Test password change with wrong current password."""
        response = test_client.put(
            "/api/auth/change-password",
            headers=auth_headers_student,
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == 401

    def test_change_password_no_auth(self, test_client):
        """Test password change without authentication."""
        response = test_client.put(
            "/api/auth/change-password",
            json={
                "current_password": "password123",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == 403
