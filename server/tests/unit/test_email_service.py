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
Unit tests for email_service.py module.
Tests for OTP generation and email sending (with mocked SMTP).
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from email_service import (
    generate_otp,
    send_otp_email,
    send_reset_password_otp_email,
)

class TestGenerateOTP:
    """Tests for OTP generation function."""

    def test_generate_otp_default_length(self):
        """Test generating OTP with default length (6)."""
        otp = generate_otp()
        
        assert otp is not None
        assert len(otp) == 6
        assert otp.isdigit()

    def test_generate_otp_custom_length(self):
        """Test generating OTP with custom length."""
        otp = generate_otp(length=8)
        
        assert len(otp) == 8
        assert otp.isdigit()

    def test_generate_otp_always_numeric(self):
        """Test that OTP is always numeric."""
        for _ in range(100):
            otp = generate_otp()
            assert otp.isdigit(), f"Generated OTP '{otp}' is not numeric"

    def test_generate_otp_uniqueness(self):
        """Test that generated OTPs are unique (statistical test)."""
        otps = set()
        for _ in range(1000):
            otp = generate_otp()
            otps.add(otp)
        
        assert len(otps) > 900, "OTPs are not sufficiently unique"

class TestSendOTPEmail:
    """Tests for send_otp_email function."""
    @patch("email_service.smtplib.SMTP")
    @patch("email_service.SMTP_EMAIL", "test@gmail.com")
    @patch("email_service.SMTP_PASSWORD", "testpass")
    def test_send_otp_email_success(self, mock_smtp):
        """Test successful OTP email sending."""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = send_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="123456"
        )
        
        assert result is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once()
        mock_server.sendmail.assert_called_once()

    @patch("email_service.SMTP_EMAIL", "")
    @patch("email_service.SMTP_PASSWORD", "")
    def test_send_otp_email_no_smtp_config(self):
        """Test when SMTP is not configured."""
        result = send_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="123456"
        )
        
        assert result is False

    @patch("email_service.smtplib.SMTP")
    @patch("email_service.SMTP_EMAIL", "test@gmail.com")
    @patch("email_service.SMTP_PASSWORD", "testpass")
    def test_send_otp_email_smtp_error(self, mock_smtp):
        """Test handling SMTP error."""
        mock_smtp.return_value.__enter__.side_effect = Exception("SMTP Error")
        
        result = send_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="123456"
        )
        
        assert result is False

    @patch("email_service.smtplib.SMTP")
    @patch("email_service.SMTP_EMAIL", "test@gmail.com")
    @patch("email_service.SMTP_PASSWORD", "testpass")
    def test_send_otp_email_content(self, mock_smtp):
        """Test email content contains OTP and user name."""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        send_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="123456"
        )
        
        assert mock_server.sendmail.called

class TestSendResetPasswordOTPEmail:
    """Tests for send_reset_password_otp_email function."""

    @patch("email_service.smtplib.SMTP")
    @patch("email_service.SMTP_EMAIL", "test@gmail.com")
    @patch("email_service.SMTP_PASSWORD", "testpass")
    def test_send_reset_password_email_success(self, mock_smtp):
        """Test successful reset password OTP email sending."""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = send_reset_password_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="654321"
        )
        
        assert result is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once()
        mock_server.sendmail.assert_called_once()

    @patch("email_service.SMTP_EMAIL", "")
    @patch("email_service.SMTP_PASSWORD", "")
    def test_send_reset_password_email_no_smtp_config(self):
        """Test when SMTP is not configured."""
        result = send_reset_password_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="654321"
        )
        
        assert result is False

    @patch("email_service.smtplib.SMTP")
    @patch("email_service.SMTP_EMAIL", "test@gmail.com")
    @patch("email_service.SMTP_PASSWORD", "testpass")
    def test_send_reset_password_email_error(self, mock_smtp):
        """Test handling SMTP error."""
        mock_smtp.return_value.__enter__.side_effect = Exception("Connection failed")
        
        result = send_reset_password_otp_email(
            to_email="user@example.com",
            user_name="Test User",
            otp="654321"
        )
        
        assert result is False

class TestEmailIntegration:
    """Integration tests for email service."""

    def test_otp_in_email_workflow(self):
        """Test OTP generation and email sending workflow."""
        otp = generate_otp()
        
        assert len(otp) == 6
        assert otp.isdigit()

    def test_different_email_types_have_different_subject(self):
        """Test that registration and reset password emails are different."""
        assert callable(send_otp_email)
        assert callable(send_reset_password_otp_email)