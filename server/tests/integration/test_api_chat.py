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
Integration tests for chat API endpoints.
"""

import os
import sys
import pytest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestChatEndpoints:
    """Tests for chat related endpoints."""

    def test_get_chat_messages(self, test_client, auth_headers_student, mock_db, sample_student_data):
        """Test getting public chat messages."""
        mock_db.chat_messages.insert_one({
            "id": "msg-001",
            "userId": sample_student_data["id"],
            "userName": sample_student_data["name"],
            "content": "Hello World",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        response = test_client.get(
            "/api/chat/messages",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) >= 1
        assert data["messages"][0]["content"] == "Hello World"

    def test_get_private_messages(self, test_client, auth_headers_student, mock_db, sample_student_data):
        """Test getting private messages."""
        other_user_id = "user-002"
        mock_db.private_messages.insert_one({
            "id": "pmsg-001",
            "fromUserId": sample_student_data["id"],
            "fromUserName": sample_student_data["name"],
            "toUserId": other_user_id,
            "content": "Secret message",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        response = test_client.get(
            f"/api/chat/private/{other_user_id}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) >= 1

    def test_get_online_users(self, test_client, auth_headers_student):
        """Test getting online users."""
        response = test_client.get(
            "/api/chat/online",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)

    def test_delete_private_chat(self, test_client, auth_headers_student, mock_db, sample_student_data):
        """Test deleting private chat history."""
        other_user_id = "user-002"
        mock_db.private_messages.insert_one({
            "id": "pmsg-001",
            "fromUserId": sample_student_data["id"],
            "fromUserName": sample_student_data["name"],
            "toUserId": other_user_id,
            "content": "Message to delete",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        response = test_client.delete(
            f"/api/chat/private/{other_user_id}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        # Verify deletion
        assert mock_db.private_messages.count_documents({"id": "pmsg-001"}) == 0

    def test_delete_chat_message_admin(self, test_client, auth_headers_admin, mock_db):
        """Test admin deleting a public chat message."""
        mock_db.chat_messages.insert_one({
            "id": "msg-to-delete",
            "userId": "user-001",
            "userName": "User",
            "content": "Bad content",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        response = test_client.delete(
            "/api/chat/messages/msg-to-delete",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200
        assert mock_db.chat_messages.count_documents({"id": "msg-to-delete"}) == 0

    def test_delete_chat_message_student_forbidden(self, test_client, auth_headers_student, mock_db):
        """Test student cannot delete chat message."""
        mock_db.chat_messages.insert_one({
            "id": "msg-protected",
            "userId": "user-001",
            "userName": "User",
            "content": "Protected content",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        response = test_client.delete(
            "/api/chat/messages/msg-protected",
            headers=auth_headers_student
        )
        
        assert response.status_code == 403

    def test_delete_all_chat_messages_admin(self, test_client, auth_headers_admin, mock_db):
        """Test admin deleting all chat messages."""
        mock_db.chat_messages.insert_many([
            {"id": "msg-1", "content": "1", "timestamp": "2024-01-01"},
            {"id": "msg-2", "content": "2", "timestamp": "2024-01-02"}
        ])
        
        response = test_client.delete(
            "/api/chat/messages",
            headers=auth_headers_admin
        )
        
        assert response.status_code == 200
        assert mock_db.chat_messages.count_documents({}) == 0
