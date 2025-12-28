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
Unit tests for ConnectionManager (Chat/WebSocket).
"""

import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import ConnectionManager

@pytest.mark.asyncio
class TestConnectionManager:
    """Tests for WebSocket Connection Manager."""

    @pytest.fixture
    def manager(self):
        """Fixture for ConnectionManager."""
        return ConnectionManager()

    @pytest.fixture
    def mock_websocket(self):
        """Fixture for mocked WebSocket."""
        ws = AsyncMock()
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        ws.close = AsyncMock()
        return ws

    async def test_connect(self, manager, mock_websocket):
        """Test user connection."""
        user = {"id": "user-1", "name": "User 1"}
        await manager.connect(mock_websocket, user)
        
        assert "user-1" in manager.active_connections
        assert manager.active_connections["user-1"]["user"] == user
        mock_websocket.accept.assert_called_once()
        assert mock_websocket.send_json.call_count >= 1

    def test_disconnect(self, manager, mock_websocket):
        """Test user disconnection."""
        manager.active_connections["user-1"] = {
            "websocket": mock_websocket,
            "user": {"id": "user-1", "name": "User 1"}
        }
        
        username = manager.disconnect("user-1")
        
        assert username == "User 1"
        assert "user-1" not in manager.active_connections

    def test_disconnect_nonexistent(self, manager):
        """Test disconnecting a user who isn't connected."""
        username = manager.disconnect("user-999")
        assert username is None

    async def test_broadcast_message(self, manager):
        """Test broadcasting message to all users."""
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        
        manager.active_connections["user-1"] = {"websocket": ws1, "user": {"id": "1"}}
        manager.active_connections["user-2"] = {"websocket": ws2, "user": {"id": "2"}}
        
        message = {"content": "Hello"}
        await manager.broadcast_message(message)
        
        ws1.send_json.assert_called_with(message)
        ws2.send_json.assert_called_with(message)

    async def test_broadcast_online_users(self, manager):
        """Test broadcasting online users list."""
        ws1 = AsyncMock()
        manager.active_connections["user-1"] = {"websocket": ws1, "user": {"id": "1", "name": "A"}}
        
        await manager.broadcast_online_users()
        
        args, _ = ws1.send_json.call_args
        msg = args[0]
        assert msg["type"] == "online_users"
        assert len(msg["users"]) == 1

    async def test_send_private_message(self, manager):
        """Test sending private message."""
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        
        manager.active_connections["user-1"] = {"websocket": ws1, "user": {"id": "user-1", "name": "A"}}
        manager.active_connections["user-2"] = {"websocket": ws2, "user": {"id": "user-2", "name": "B"}}
        
        success = await manager.send_private_message(
            from_user={"id": "user-1", "name": "A"},
            to_user_id="user-2",
            content="Secret"
        )
        
        assert success is True
        ws2.send_json.assert_called_once()
        args, _ = ws2.send_json.call_args
        msg = args[0]
        assert msg["type"] == "private_message"
        assert msg["content"] == "Secret"
        ws1.send_json.assert_not_called()

    async def test_send_private_message_offline(self, manager):
        """Test private message to offline user."""
        success = await manager.send_private_message(
            from_user={"id": "1"},
            to_user_id="offline-user",
            content="Hello"
        )
        assert success is False
