import { User } from '../types';

const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  return `${protocol}//${hostname}:8000`;
};

const API_BASE_URL = getApiBaseUrl();

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Đã xảy ra lỗi' }));
      const errorMessage = Array.isArray(error.detail)
        ? error.detail.map((e: any) => e.msg).join(', ')
        : (error.detail || `Lỗi HTTP! Mã trạng thái: ${response.status}`);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi không xác định');
  }
}

export interface UpdateProfileRequest {
  name?: string;
  dob?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface SendOTPRequest {
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function sendOTP(data: SendOTPRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<User> {
  return apiRequest<User>('/api/auth/me', {
    method: 'GET',
  });
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return apiRequest<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Admin API functions
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'admin';
}

export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/api/admin/users', {
    method: 'GET',
  });
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  return apiRequest<User>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function lockUser(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}/lock`, {
    method: 'PUT',
  });
}

export async function unlockUser(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}/unlock`, {
    method: 'PUT',
  });
}

// Quiz API functions
import { Quiz, Question, PaginatedResponse } from '../types';

export interface CreateQuizRequest {
  title: string;
  description: string;
  questions: Question[];
  duration: number;
  settings: {
    chapter?: string;
    topic?: string;
    knowledgeTypes?: string[];
    difficulty?: string;
    questionCount: number;
  };
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  duration?: number;
  questions?: Question[];
}

export interface UpdateQuestionRequest {
  content?: string;
  options?: string[];
  correctAnswer?: number;
  chapter?: string;
  topic?: string;
  knowledgeType?: string;
  difficulty?: string;
  explanation?: string;
}

export async function getQuizzes(createdBy?: string, page: number = 1, size: number = 10): Promise<PaginatedResponse<Quiz>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (createdBy) {
    queryParams.append('created_by', createdBy);
  }

  const url = `/api/quizzes?${queryParams.toString()}`;
  const response = await apiRequest<PaginatedResponse<Quiz>>(url, {
    method: 'GET',
  });

  return {
    ...response,
    items: response.items.map(quiz => ({
      ...quiz,
      createdAt: new Date(quiz.createdAt)
    }))
  };
}

export async function getQuiz(quizId: string): Promise<Quiz> {
  const quiz = await apiRequest<Quiz>(`/api/quizzes/${quizId}`, {
    method: 'GET',
  });
  return {
    ...quiz,
    createdAt: new Date(quiz.createdAt)
  };
}

export async function createQuiz(data: CreateQuizRequest): Promise<Quiz> {
  const quiz = await apiRequest<Quiz>('/api/quizzes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    ...quiz,
    createdAt: new Date(quiz.createdAt)
  };
}

export async function updateQuiz(quizId: string, data: UpdateQuizRequest): Promise<Quiz> {
  const quiz = await apiRequest<Quiz>(`/api/quizzes/${quizId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return {
    ...quiz,
    createdAt: new Date(quiz.createdAt)
  };
}

export async function deleteQuiz(quizId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/quizzes/${quizId}`, {
    method: 'DELETE',
  });
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  data: UpdateQuestionRequest
): Promise<Quiz> {
  const quiz = await apiRequest<Quiz>(`/api/quizzes/${quizId}/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return {
    ...quiz,
    createdAt: new Date(quiz.createdAt)
  };
}

export async function deleteQuestion(
  quizId: string,
  questionId: string
): Promise<Quiz> {
  const quiz = await apiRequest<Quiz>(`/api/quizzes/${quizId}/questions/${questionId}`, {
    method: 'DELETE',
  });
  return {
    ...quiz,
    createdAt: new Date(quiz.createdAt)
  };
}

// Attempt API functions
import { QuizAttempt } from '../types';

export interface CreateAttemptRequest {
  quizId: string;
  answers: { [questionId: string]: number };
  score: number;
  timeSpent: number;
}

export async function createAttempt(data: CreateAttemptRequest): Promise<QuizAttempt> {
  const attempt = await apiRequest<QuizAttempt>('/api/attempts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    ...attempt,
    completedAt: new Date(attempt.completedAt)
  };
}

export async function getAttempts(quizId?: string): Promise<QuizAttempt[]> {
  const url = quizId ? `/api/attempts?quiz_id=${quizId}` : '/api/attempts';
  const attempts = await apiRequest<QuizAttempt[]>(url, {
    method: 'GET',
  });
  return attempts.map(attempt => ({
    ...attempt,
    completedAt: new Date(attempt.completedAt)
  }));
}

export async function getAttempt(attemptId: string): Promise<QuizAttempt> {
  const attempt = await apiRequest<QuizAttempt>(`/api/attempts/${attemptId}`, {
    method: 'GET',
  });
  return {
    ...attempt,
    completedAt: new Date(attempt.completedAt)
  };
}

// Analysis History API functions
import { AnalysisHistory } from '../types';

export async function getAnalysisHistory(page: number = 1, size: number = 10): Promise<PaginatedResponse<AnalysisHistory>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiRequest<PaginatedResponse<AnalysisHistory>>(`/api/analysis-history?${queryParams.toString()}`, {
    method: 'GET',
  });

  return {
    ...response,
    items: response.items.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt)
    }))
  };
}

export async function deleteAnalysisHistoryItem(analysisId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/analysis-history/${analysisId}`, {
    method: 'DELETE',
  });
}

// Chat API functions
import { ChatMessage, OnlineUser, PrivateMessage } from '../types';

export async function getChatMessages(limit: number = 50): Promise<{ messages: ChatMessage[] }> {
  return apiRequest<{ messages: ChatMessage[] }>(`/api/chat/messages?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getPrivateChatMessages(userId: string, limit: number = 50): Promise<{ messages: PrivateMessage[] }> {
  return apiRequest<{ messages: PrivateMessage[] }>(`/api/chat/private/${userId}?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getOnlineUsers(): Promise<{ users: OnlineUser[] }> {
  return apiRequest<{ users: OnlineUser[] }>('/api/chat/online', {
    method: 'GET',
  });
}

export async function deletePrivateChat(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/chat/private/${userId}`, {
    method: 'DELETE',
  });
}

export async function deleteChatMessage(messageId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/chat/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function deleteAllChatMessages(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/chat/messages', {
    method: 'DELETE',
  });
}

// Quiz Discussion API functions
import { QuizDiscussion, DiscussionMessage } from '../types';

export async function addQuizToDiscussion(quizId: string): Promise<QuizDiscussion> {
  return apiRequest<QuizDiscussion>('/api/discussions', {
    method: 'POST',
    body: JSON.stringify({ quizId }),
  });
}

export async function getQuizDiscussions(page: number = 1, size: number = 10): Promise<PaginatedResponse<QuizDiscussion>> {
  return apiRequest<PaginatedResponse<QuizDiscussion>>(`/api/discussions?page=${page}&size=${size}`, {
    method: 'GET',
  });
}

export async function removeQuizFromDiscussion(quizId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/discussions/${quizId}`, {
    method: 'DELETE',
  });
}

export async function getDiscussionMessages(quizId: string, limit: number = 100): Promise<DiscussionMessage[]> {
  return apiRequest<DiscussionMessage[]>(`/api/discussions/${quizId}/messages?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getDiscussionOnlineUsers(quizId: string): Promise<{ users: OnlineUser[] }> {
  return apiRequest<{ users: OnlineUser[] }>(`/api/discussions/${quizId}/online`, {
    method: 'GET',
  });
}