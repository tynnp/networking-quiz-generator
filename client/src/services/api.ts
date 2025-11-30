import { User } from '../types';

const API_BASE_URL = 'http://localhost:8000';

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
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

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
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
import { Quiz, Question } from '../types';

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

export async function getQuizzes(createdBy?: string): Promise<Quiz[]> {
  const url = createdBy ? `/api/quizzes?created_by=${createdBy}` : '/api/quizzes';
  const quizzes = await apiRequest<Quiz[]>(url, {
    method: 'GET',
  });
  // Convert createdAt string to Date
  return quizzes.map(quiz => ({
    ...quiz,
    createdAt: new Date(quiz.createdAt)
  }));
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

