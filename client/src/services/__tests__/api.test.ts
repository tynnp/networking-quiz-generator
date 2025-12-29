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
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    apiRequest,
    login,
    register,
    sendOTP,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getUsers,
    createUser,
    deleteUser,
    lockUser,
    unlockUser,
    updateUserRole,
    adminResetPassword,
    getQuizzes,
    getQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    updateQuestion,
    deleteQuestion,
    createAttempt,
    getAttempts,
    getAttempt,
    getAnalysisHistory,
    deleteAnalysisHistoryItem,
    getChatMessages,
    getPrivateChatMessages,
    getOnlineUsers,
    deletePrivateChat,
    deleteChatMessage,
    deleteAllChatMessages,
    addQuizToDiscussion,
    getQuizDiscussions,
    removeQuizFromDiscussion,
    getDiscussionMessages,
    getDiscussionQuiz,
    getDiscussionOnlineUsers,
    getGeminiSettings,
    saveGeminiSettings,
    getSystemSettings,
    toggleDefaultKeyLock,
    getDefaultKeyStatus,
} from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Quản lý Auth Token', () => {
        it('getAuthToken trả về null khi chưa có token', () => {
            localStorageMock.getItem.mockReturnValue(null);
            expect(getAuthToken()).toBeNull();
        });

        it('getAuthToken trả về token đã lưu', () => {
            localStorageMock.getItem.mockReturnValue('test-token');
            expect(getAuthToken()).toBe('test-token');
        });

        it('setAuthToken lưu token vào localStorage', () => {
            setAuthToken('new-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
        });

        it('removeAuthToken xóa token khỏi localStorage', () => {
            removeAuthToken();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
        });
    });

    describe('apiRequest', () => {
        it('gửi request với headers đúng', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            await apiRequest('/api/test');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('thêm auth token vào headers khi có token', async () => {
            localStorageMock.getItem.mockReturnValue('auth-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            await apiRequest('/api/test');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer auth-token',
                    }),
                })
            );
        });

        it('ném lỗi khi response không ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ detail: 'Unauthorized' }),
            });

            await expect(apiRequest('/api/test')).rejects.toThrow('Unauthorized');
        });

        it('xử lý lỗi mạng', async () => {
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

            await expect(apiRequest('/api/test')).rejects.toThrow(
                'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.'
            );
        });

        it('xử lý mảng lỗi validation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 422,
                json: () => Promise.resolve({
                    detail: [
                        { msg: 'Email is required' },
                        { msg: 'Password is too short' },
                    ],
                }),
            });

            await expect(apiRequest('/api/test')).rejects.toThrow(
                'Email is required, Password is too short'
            );
        });

        it('merge headers tùy chỉnh với headers mặc định', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            await apiRequest('/api/test', {
                headers: {
                    'X-Custom-Header': 'custom-value',
                },
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-Custom-Header': 'custom-value',
                    }),
                })
            );
        });

        it('fallback sang status text khi response.json() thất bại', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: () => Promise.reject(new Error('Invalid JSON')),
            });

            await expect(apiRequest('/api/test')).rejects.toThrow(
                'Đã xảy ra lỗi'
            );
        });

        it('fallback sang status text khi error detail rỗng', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({}),
            });

            await expect(apiRequest('/api/test')).rejects.toThrow(
                'Lỗi HTTP! Mã trạng thái: 400'
            );
        });

        it('xử lý lỗi không xác định (không phải Error instance)', async () => {
            mockFetch.mockRejectedValueOnce('Chuỗi lỗi không xác định');

            await expect(apiRequest('/api/test')).rejects.toThrow(
                'Đã xảy ra lỗi không xác định'
            );
        });
    });

    describe('Chức năng Xác thực', () => {
        it('login gửi request đúng', async () => {
            const mockResponse = {
                access_token: 'token123',
                token_type: 'bearer',
                user: { id: '1', email: 'test@test.com', name: 'Test', role: 'student' },
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await login({ email: 'test@test.com', password: 'password123' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/login',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('register gửi request đúng', async () => {
            const mockResponse = {
                access_token: 'token123',
                token_type: 'bearer',
                user: { id: '1', email: 'test@test.com', name: 'Test', role: 'student' },
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await register({
                email: 'test@test.com',
                password: 'password123',
                name: 'Test User',
                otp: '123456',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/register',
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('sendOTP gửi request đúng', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'OTP sent' }),
            });

            await sendOTP({ email: 'test@test.com', name: 'Test' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/send-otp',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('getMe trả về dữ liệu người dùng', async () => {
            const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'student' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUser),
            });

            const result = await getMe();
            expect(result).toEqual(mockUser);
        });

        it('updateProfile gửi PUT request', async () => {
            const mockUser = { id: '1', email: 'test@test.com', name: 'Updated', role: 'student' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUser),
            });

            await updateProfile({ name: 'Updated' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/profile',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('changePassword gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Password changed' }),
            });

            await changePassword({ current_password: 'old', new_password: 'new' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/change-password',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('forgotPassword gửi POST request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Email sent' }),
            });

            await forgotPassword({ email: 'test@test.com' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/forgot-password',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('resetPassword gửi POST request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Password reset' }),
            });

            await resetPassword({ email: 'test@test.com', otp: '123456', new_password: 'newpass' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/auth/reset-password',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });
    });

    describe('Chức năng Quản trị', () => {
        it('getUsers trả về danh sách người dùng', async () => {
            const mockUsers = [{ id: '1', email: 'test@test.com', name: 'Test', role: 'student' }];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUsers),
            });

            const result = await getUsers();
            expect(result).toEqual(mockUsers);
        });

        it('createUser gửi POST request', async () => {
            const mockUser = { id: '1', email: 'new@test.com', name: 'New', role: 'student' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUser),
            });

            await createUser({ email: 'new@test.com', password: 'pass', name: 'New' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/users',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('deleteUser gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'User deleted' }),
            });

            await deleteUser('user-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/users/user-123',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('lockUser gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'User locked' }),
            });

            await lockUser('user-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/users/user-123/lock',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('unlockUser gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'User unlocked' }),
            });

            await unlockUser('user-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/users/user-123/unlock',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('updateUserRole gửi PUT request với role', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Role updated' }),
            });

            await updateUserRole('user-123', 'admin');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/users/user-123/role',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ role: 'admin' }),
                })
            );
        });

        it('adminResetPassword gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Password reset' }),
            });

            await adminResetPassword('user-123', 'newpass');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/users/user-123/reset-password',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });
    });

    describe('Chức năng Đề thi', () => {
        const mockQuiz = {
            id: 'quiz-1',
            title: 'Test Quiz',
            description: 'A test quiz',
            questions: [],
            duration: 30,
            createdBy: 'user-1',
            createdAt: '2025-01-01T00:00:00Z',
            settings: { questionCount: 10 },
        };

        it('getQuizzes trả về danh sách đề thi phân trang với chuyển đổi ngày', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    items: [mockQuiz],
                    total: 1,
                    page: 1,
                    size: 10,
                    pages: 1,
                }),
            });

            const result = await getQuizzes(undefined, 1, 10);

            expect(result.items[0].createdAt).toBeInstanceOf(Date);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/quizzes?page=1&size=10',
                expect.any(Object)
            );
        });

        it('getQuizzes lọc theo createdBy', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    items: [],
                    total: 0,
                    page: 1,
                    size: 10,
                    pages: 0,
                }),
            });

            await getQuizzes('user-123');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('created_by=user-123'),
                expect.any(Object)
            );
        });

        it('getQuiz trả về đề thi với chuyển đổi ngày', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockQuiz),
            });

            const result = await getQuiz('quiz-1');

            expect(result.createdAt).toBeInstanceOf(Date);
        });

        it('createQuiz gửi POST request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockQuiz),
            });

            await createQuiz({
                title: 'New Quiz',
                description: 'Desc',
                questions: [],
                duration: 30,
                settings: { questionCount: 10 },
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/quizzes',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('updateQuiz gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockQuiz),
            });

            await updateQuiz('quiz-1', { title: 'Updated Title' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/quizzes/quiz-1',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('deleteQuiz gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Deleted' }),
            });

            await deleteQuiz('quiz-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/quizzes/quiz-1',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('updateQuestion gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockQuiz),
            });

            await updateQuestion('quiz-1', 'q-1', { content: 'Updated question' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/quizzes/quiz-1/questions/q-1',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('deleteQuestion gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockQuiz),
            });

            await deleteQuestion('quiz-1', 'q-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/quizzes/quiz-1/questions/q-1',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    describe('Chức năng Lượt làm bài', () => {
        const mockAttempt = {
            id: 'attempt-1',
            quizId: 'quiz-1',
            studentId: 'user-1',
            answers: {},
            score: 80,
            completedAt: '2025-01-01T00:00:00Z',
            timeSpent: 1200,
        };

        it('createAttempt gửi POST request với chuyển đổi ngày', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAttempt),
            });

            const result = await createAttempt({
                quizId: 'quiz-1',
                answers: { q1: 0 },
                score: 80,
                timeSpent: 1200,
            });

            expect(result.completedAt).toBeInstanceOf(Date);
        });

        it('getAttempts trả về danh sách lượt làm với chuyển đổi ngày', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([mockAttempt]),
            });

            const result = await getAttempts();

            expect(result[0].completedAt).toBeInstanceOf(Date);
        });

        it('getAttempts lọc theo quizId', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([mockAttempt]),
            });

            await getAttempts('quiz-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/attempts?quiz_id=quiz-123',
                expect.any(Object)
            );
        });

        it('getAttempt trả về lượt làm với chuyển đổi ngày', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAttempt),
            });

            const result = await getAttempt('attempt-1');

            expect(result.completedAt).toBeInstanceOf(Date);
        });
    });

    describe('Chức năng Lịch sử Phân tích', () => {
        it('getAnalysisHistory trả về kết quả phân trang', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    items: [{
                        id: 'analysis-1',
                        userId: 'user-1',
                        analysisType: 'result',
                        title: 'Analysis',
                        result: {},
                        createdAt: '2025-01-01T00:00:00Z',
                    }],
                    total: 1,
                    page: 1,
                    size: 10,
                    pages: 1,
                }),
            });

            const result = await getAnalysisHistory(1, 10);

            expect(result.items[0].createdAt).toBeInstanceOf(Date);
        });

        it('deleteAnalysisHistoryItem gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Deleted' }),
            });

            await deleteAnalysisHistoryItem('analysis-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/analysis-history/analysis-1',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    describe('Chức năng Chat', () => {
        it('getChatMessages trả về tin nhắn', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ messages: [] }),
            });

            await getChatMessages(50);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/chat/messages?limit=50',
                expect.any(Object)
            );
        });

        it('getPrivateChatMessages trả về tin nhắn riêng', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ messages: [] }),
            });

            await getPrivateChatMessages('user-123', 50);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/chat/private/user-123?limit=50',
                expect.any(Object)
            );
        });

        it('getOnlineUsers trả về danh sách người dùng online', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ users: [] }),
            });

            const result = await getOnlineUsers();
            expect(result).toEqual({ users: [] });
        });

        it('deletePrivateChat gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Deleted' }),
            });

            await deletePrivateChat('user-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/chat/private/user-123',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('deleteChatMessage gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Deleted' }),
            });

            await deleteChatMessage('msg-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/chat/messages/msg-123',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('deleteAllChatMessages gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Deleted' }),
            });

            await deleteAllChatMessages();

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/chat/messages',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    describe('Chức năng Thảo luận', () => {
        it('addQuizToDiscussion gửi POST request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'disc-1', quizId: 'quiz-1' }),
            });

            await addQuizToDiscussion('quiz-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/discussions',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ quizId: 'quiz-1' }),
                })
            );
        });

        it('getQuizDiscussions trả về kết quả phân trang', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    items: [],
                    total: 0,
                    page: 1,
                    size: 10,
                    pages: 0,
                }),
            });

            await getQuizDiscussions(1, 10);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/discussions?page=1&size=10',
                expect.any(Object)
            );
        });

        it('removeQuizFromDiscussion gửi DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Removed' }),
            });

            await removeQuizFromDiscussion('quiz-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/discussions/quiz-1',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('getDiscussionMessages trả về tin nhắn thảo luận', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await getDiscussionMessages('quiz-1', 100);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/discussions/quiz-1/messages?limit=100',
                expect.any(Object)
            );
        });

        it('getDiscussionQuiz trả về đề thi với chuyển đổi ngày', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    id: 'quiz-1',
                    createdAt: '2025-01-01T00:00:00Z',
                }),
            });

            const result = await getDiscussionQuiz('quiz-1');

            expect(result.createdAt).toBeInstanceOf(Date);
        });

        it('getDiscussionOnlineUsers trả về danh sách người dùng online', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ users: [] }),
            });

            await getDiscussionOnlineUsers('quiz-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/discussions/quiz-1/online',
                expect.any(Object)
            );
        });
    });

    describe('Chức năng Cài đặt', () => {
        it('getGeminiSettings trả về cài đặt hoặc null khi lỗi', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ model: 'gemini-pro' }),
            });

            const result = await getGeminiSettings();
            expect(result).toEqual({ model: 'gemini-pro' });
        });

        it('getGeminiSettings trả về null khi có lỗi', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getGeminiSettings();
            expect(result).toBeNull();
        });

        it('saveGeminiSettings gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Saved' }),
            });

            await saveGeminiSettings({ model: 'gemini-pro' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/settings/gemini',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('getSystemSettings trả về cài đặt hệ thống', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ defaultKeyLocked: false }),
            });

            const result = await getSystemSettings();
            expect(result).toEqual({ defaultKeyLocked: false });
        });

        it('toggleDefaultKeyLock gửi PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Updated' }),
            });

            await toggleDefaultKeyLock(true);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/admin/settings/lock-default-key',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ locked: true }),
                })
            );
        });

        it('getDefaultKeyStatus trả về trạng thái', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    defaultKeyLocked: false,
                    hasPersonalKey: true,
                    canUseAI: true,
                }),
            });

            const result = await getDefaultKeyStatus();
            expect(result.canUseAI).toBe(true);
        });
    });
});
