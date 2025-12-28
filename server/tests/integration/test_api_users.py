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
Integration tests for user management API endpoints (admin only).
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestGetAllUsersEndpoint:
    """Tests for GET /api/admin/users endpoint."""

    def test_get_all_users_as_admin(self, test_client, auth_headers_admin, student_user, admin_user):
        """Test getting all users as admin."""
        response = test_client.get(
            "/api/admin/users",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_get_all_users_as_student(self, test_client, auth_headers_student):
        """Test getting all users as student (should be forbidden)."""
        response = test_client.get(
            "/api/admin/users",
            headers=auth_headers_student
        )
        
        assert response.status_code == 403

    def test_get_all_users_no_auth(self, test_client):
        """Test getting all users without authentication."""
        response = test_client.get("/api/admin/users")
        
        assert response.status_code == 403

class TestCreateUserEndpoint:
    """Tests for POST /api/admin/users endpoint."""

    @pytest.fixture
    def create_user_payload(self):
        """Valid user creation payload."""
        return {
            "email": "newadmin@example.com",
            "password": "password123",
            "name": "New Admin User",
            "role": "admin"
        }

    def test_create_user_as_admin(self, test_client, auth_headers_admin, create_user_payload):
        """Test creating a user as admin."""
        response = test_client.post(
            "/api/admin/users",
            headers=auth_headers_admin,
            json=create_user_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == create_user_payload["email"]
        assert data["role"] == "admin"

    def test_create_user_as_student(self, test_client, auth_headers_student, create_user_payload):
        """Test creating a user as student (should be forbidden)."""
        response = test_client.post(
            "/api/admin/users",
            headers=auth_headers_student,
            json=create_user_payload
        )
        
        assert response.status_code == 403

    def test_create_user_duplicate_email(self, test_client, auth_headers_admin, student_user):
        """Test creating user with duplicate email."""
        response = test_client.post(
            "/api/admin/users",
            headers=auth_headers_admin,
            json={
                "email": student_user["email"],
                "password": "password123",
                "name": "Duplicate User"
            }
        )
        
        assert response.status_code == 400

class TestDeleteUserEndpoint:
    """Tests for DELETE /api/admin/users/{user_id} endpoint."""

    def test_delete_user_as_admin(self, test_client, auth_headers_admin, student_user):
        """Test deleting a user as admin."""
        response = test_client.delete(
            f"/api/admin/users/{student_user['id']}",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200

    def test_delete_user_as_student(self, test_client, auth_headers_student, admin_user):
        """Test deleting a user as student (should be forbidden)."""
        response = test_client.delete(
            f"/api/admin/users/{admin_user['id']}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 403

    def test_delete_user_not_found(self, test_client, auth_headers_admin):
        """Test deleting non-existent user."""
        response = test_client.delete(
            "/api/admin/users/nonexistent-id",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 404

    def test_delete_self(self, test_client, auth_headers_admin, admin_user):
        """Test admin deleting themselves (should be prevented)."""
        response = test_client.delete(
            f"/api/admin/users/{admin_user['id']}",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 400

class TestLockUserEndpoint:
    """Tests for PUT /api/admin/users/{user_id}/lock endpoint."""

    def test_lock_user_as_admin(self, test_client, auth_headers_admin, student_user):
        """Test locking a user as admin."""
        response = test_client.put(
            f"/api/admin/users/{student_user['id']}/lock",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200

    def test_lock_user_as_student(self, test_client, auth_headers_student, admin_user):
        """Test locking a user as student (should be forbidden)."""
        response = test_client.put(
            f"/api/admin/users/{admin_user['id']}/lock",
            headers=auth_headers_student
        )
        
        assert response.status_code == 403

    def test_lock_user_not_found(self, test_client, auth_headers_admin):
        """Test locking non-existent user."""
        response = test_client.put(
            "/api/admin/users/nonexistent-id/lock",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 404

class TestUnlockUserEndpoint:
    """Tests for PUT /api/admin/users/{user_id}/unlock endpoint."""

    def test_unlock_user_as_admin(self, test_client, auth_headers_admin, mock_db, student_user):
        """Test unlocking a user as admin."""
        mock_db.users.update_one(
            {"id": student_user["id"]},
            {"$set": {"isLocked": True}}
        )
        
        response = test_client.put(
            f"/api/admin/users/{student_user['id']}/unlock",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200

    def test_unlock_user_as_student(self, test_client, auth_headers_student, admin_user):
        """Test unlocking a user as student (should be forbidden)."""
        response = test_client.put(
            f"/api/admin/users/{admin_user['id']}/unlock",
            headers=auth_headers_student
        )
        
        assert response.status_code == 403

class TestUpdateUserRoleEndpoint:
    """Tests for PUT /api/admin/users/{user_id}/role endpoint."""

    def test_update_user_role_to_admin(self, test_client, auth_headers_admin, student_user):
        """Test promoting user to admin."""
        response = test_client.put(
            f"/api/admin/users/{student_user['id']}/role",
            headers=auth_headers_admin,
            json={"role": "admin"}
        )
        
        assert response.status_code == 200

    def test_update_user_role_to_student(self, test_client, auth_headers_admin, mock_db, admin_user):
        """Test demoting admin to student."""
        from auth import create_user
        new_admin = create_user(mock_db, "admin2@example.com", "password123", "Admin 2", "admin")
        
        response = test_client.put(
            f"/api/admin/users/{new_admin['id']}/role",
            headers=auth_headers_admin,
            json={"role": "student"}
        )
        
        assert response.status_code == 200

    def test_update_user_role_as_student(self, test_client, auth_headers_student, admin_user):
        """Test updating role as student (should be forbidden)."""
        response = test_client.put(
            f"/api/admin/users/{admin_user['id']}/role",
            headers=auth_headers_student,
            json={"role": "student"}
        )
        
        assert response.status_code == 403

class TestAdminResetPasswordEndpoint:
    """Tests for PUT /api/admin/users/{user_id}/reset-password endpoint."""

    def test_admin_reset_password(self, test_client, auth_headers_admin, student_user):
        """Test admin resetting user password."""
        response = test_client.put(
            f"/api/admin/users/{student_user['id']}/reset-password",
            headers=auth_headers_admin,
            json={"new_password": "newpassword123"}
        )
        
        assert response.status_code == 200

    def test_admin_reset_password_as_student(self, test_client, auth_headers_student, admin_user):
        """Test resetting password as student (should be forbidden)."""
        response = test_client.put(
            f"/api/admin/users/{admin_user['id']}/reset-password",
            headers=auth_headers_student,
            json={"new_password": "newpassword123"}
        )
        
        assert response.status_code == 403

    def test_admin_reset_password_user_not_found(self, test_client, auth_headers_admin):
        """Test resetting password for non-existent user."""
        response = test_client.put(
            "/api/admin/users/nonexistent-id/reset-password",
            headers=auth_headers_admin,
            json={"new_password": "newpassword123"}
        )
        
        assert response.status_code == 404