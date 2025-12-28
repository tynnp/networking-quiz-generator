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
Integration tests for settings API endpoints.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestGeminiSettingsEndpoints:
    """Tests for Gemini settings endpoints."""

    def test_get_gemini_settings(self, test_client, auth_headers_student):
        """Test getting Gemini settings."""
        response = test_client.get(
            "/api/settings/gemini",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200

    def test_update_gemini_settings(self, test_client, auth_headers_student):
        """Test updating Gemini settings."""
        response = test_client.put(
            "/api/settings/gemini",
            headers=auth_headers_student,
            json={
                "model": "gemini-2.5-flash"
            }
        )
        
        assert response.status_code == 200

class TestDefaultKeyStatusEndpoint:
    """Tests for default API key status endpoint."""

    def test_get_default_key_status(self, test_client, auth_headers_student):
        """Test getting default key status."""
        response = test_client.get(
            "/api/settings/default-key-status",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "defaultKeyLocked" in data

class TestAdminSettingsEndpoints:
    """Tests for admin settings endpoints."""

    def test_get_admin_settings(self, test_client, auth_headers_admin):
        """Test getting admin settings."""
        response = test_client.get(
            "/api/admin/settings",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200

    def test_get_admin_settings_as_student(self, test_client, auth_headers_student):
        """Test getting admin settings as student (should be forbidden)."""
        response = test_client.get(
            "/api/admin/settings",
            headers=auth_headers_student
        )
        
        assert response.status_code == 403

    def test_toggle_default_key_lock(self, test_client, auth_headers_admin):
        """Test toggling default key lock."""
        response = test_client.put(
            "/api/admin/settings/lock-default-key",
            headers=auth_headers_admin,
            json={"locked": True}
        )
        
        assert response.status_code == 200
