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

// Auth API functions
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

