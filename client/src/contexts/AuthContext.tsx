import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await apiRequest<User>('/api/auth/me');
          setUser(userData);
        } catch (error) {
          // Token is invalid, remove it
          removeAuthToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(response.access_token);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    setAuthToken(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
  };

  const refreshUser = async () => {
    try {
      const userData = await apiRequest<User>('/api/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      updateUser,
      refreshUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
