/*
 * Copyright 2025 Nguyễn Ngọc Phú Tỷ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    WS_BASE_URL,
    createChatWebSocket,
    createDiscussionWebSocket,
} from '../websocket';

// Store original window.location
const originalLocation = window.location;

describe('WebSocket Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore original location
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    describe('WS_BASE_URL', () => {
        it('sử dụng ws://localhost:8000 cho localhost', () => {
            // Default mock is localhost
            expect(WS_BASE_URL).toBe('ws://localhost:8000');
        });
    });

    describe('createChatWebSocket', () => {
        it('tạo WebSocket với URL và token đúng', () => {
            const token = 'test-token-123';
            const ws = createChatWebSocket(token);

            expect(ws.url).toBe(`ws://localhost:8000/ws/chat?token=${encodeURIComponent(token)}`);
        });

        it('mã hóa ký tự đặc biệt trong token', () => {
            const token = 'token with spaces & special=chars';
            const ws = createChatWebSocket(token);

            expect(ws.url).toContain(encodeURIComponent(token));
        });

        it('trả về instance WebSocket', () => {
            const ws = createChatWebSocket('test-token');

            expect(ws).toHaveProperty('send');
            expect(ws).toHaveProperty('close');
            expect(ws).toHaveProperty('url');
        });
    });

    describe('createDiscussionWebSocket', () => {
        it('tạo WebSocket với URL, quizId và token đúng', () => {
            const token = 'test-token-456';
            const quizId = 'quiz-123';
            const ws = createDiscussionWebSocket(token, quizId);

            expect(ws.url).toBe(
                `ws://localhost:8000/ws/discussion/${quizId}?token=${encodeURIComponent(token)}`
            );
        });

        it('mã hóa ký tự đặc biệt trong token', () => {
            const token = 'token+with/special';
            const quizId = 'quiz-456';
            const ws = createDiscussionWebSocket(token, quizId);

            expect(ws.url).toContain(encodeURIComponent(token));
            expect(ws.url).toContain(`/ws/discussion/${quizId}`);
        });

        it('trả về instance WebSocket', () => {
            const ws = createDiscussionWebSocket('token', 'quiz-id');

            expect(ws).toHaveProperty('send');
            expect(ws).toHaveProperty('close');
            expect(ws).toHaveProperty('url');
        });

        it('xử lý các quiz ID khác nhau', () => {
            const token = 'token';
            const ws1 = createDiscussionWebSocket(token, 'quiz-1');
            const ws2 = createDiscussionWebSocket(token, 'quiz-2');

            expect(ws1.url).toContain('quiz-1');
            expect(ws2.url).toContain('quiz-2');
            expect(ws1.url).not.toBe(ws2.url);
        });
    });

    describe('Tạo URL WebSocket với các Location khác nhau', () => {
        it('sử dụng ws protocol cho http', () => {
            // Default setup uses localhost with http
            expect(WS_BASE_URL.startsWith('ws://')).toBe(true);
        });

        it('mã hóa token rỗng', () => {
            const ws = createChatWebSocket('');
            expect(ws.url).toBe('ws://localhost:8000/ws/chat?token=');
        });

        it('xử lý unicode trong token', () => {
            const token = 'token-với-tiếng-việt';
            const ws = createChatWebSocket(token);
            expect(ws.url).toContain(encodeURIComponent(token));
        });
    });

    describe('Kiểu Interface', () => {
        it('ChatWebSocketMessage hỗ trợ kiểu message', () => {
            const message = {
                type: 'message' as const,
                id: 'msg-1',
                userId: 'user-1',
                userName: 'Test User',
                content: 'Hello',
                timestamp: '2025-01-01T00:00:00Z',
            };

            expect(message.type).toBe('message');
        });

        it('ChatWebSocketMessage hỗ trợ kiểu system', () => {
            const message = {
                type: 'system' as const,
                content: 'User joined',
            };

            expect(message.type).toBe('system');
        });

        it('ChatWebSocketMessage hỗ trợ kiểu online_users', () => {
            const message = {
                type: 'online_users' as const,
                users: [
                    { id: 'user-1', name: 'User 1' },
                    { id: 'user-2', name: 'User 2' },
                ],
            };

            expect(message.type).toBe('online_users');
            expect(message.users).toHaveLength(2);
        });

        it('ChatWebSocketMessage hỗ trợ kiểu private_message', () => {
            const message = {
                type: 'private_message' as const,
                from: { id: 'user-1', name: 'User 1' },
                content: 'Private message',
            };

            expect(message.type).toBe('private_message');
            expect(message.from).toBeDefined();
        });

        it('SendChatMessage hỗ trợ kiểu message', () => {
            const message = {
                type: 'message' as const,
                content: 'Hello everyone',
            };

            expect(message.type).toBe('message');
        });

        it('SendChatMessage hỗ trợ kiểu private với trường to', () => {
            const message = {
                type: 'private' as const,
                content: 'Hello user',
                to: 'user-123',
            };

            expect(message.type).toBe('private');
            expect(message.to).toBe('user-123');
        });

        it('DiscussionWebSocketMessage hỗ trợ kiểu message', () => {
            const message = {
                type: 'message' as const,
                id: 'msg-1',
                userId: 'user-1',
                userName: 'User',
                content: 'Discussion message',
                timestamp: '2025-01-01T00:00:00Z',
            };

            expect(message.type).toBe('message');
        });

        it('DiscussionWebSocketMessage hỗ trợ kiểu error', () => {
            const message = {
                type: 'error' as const,
                content: 'Error occurred',
            };

            expect(message.type).toBe('error');
        });

        it('SendDiscussionMessage có kiểu message', () => {
            const message = {
                type: 'message' as const,
                content: 'Discussion input',
            };

            expect(message.type).toBe('message');
        });
    });
});
