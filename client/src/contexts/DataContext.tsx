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

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Quiz, QuizAttempt, Question } from '../types';
import { useAuth } from './AuthContext';
import {
  getQuizzes,
  getQuiz as getQuizAPI,
  createQuiz as createQuizAPI,
  deleteQuiz as deleteQuizAPI,
  updateQuestion as updateQuestionAPI,
  deleteQuestion as deleteQuestionAPI,
  getAttempts as getAttemptsAPI,
  getAttempt as getAttemptAPI,
  CreateQuizRequest,
  UpdateQuestionRequest,
  updateQuiz as updateQuizAPI,
  UpdateQuizRequest
} from '../services/api';

export interface DataContextType {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  loading: boolean;
  attemptsLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuizzes: number;
    pageSize: number;
    setPage: (page: number) => void;
  };
  addQuiz: (quiz: Quiz) => Promise<void>;
  addAttempt: (attempt: QuizAttempt) => void;
  deleteQuiz: (id: string) => Promise<void>;
  updateQuiz: (id: string, updates: UpdateQuizRequest) => Promise<void>;
  updateQuestion: (quizId: string, questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (quizId: string, questionId: string) => Promise<void>;
  getQuizById: (id: string) => Quiz | undefined;
  loadQuizById: (id: string) => Promise<Quiz | undefined>;
  getAttemptsByStudent: (studentId: string) => QuizAttempt[];
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getAttemptById: (id: string) => QuizAttempt | undefined;
  loadAttemptById: (id: string) => Promise<QuizAttempt | undefined>;
  refreshQuizzes: () => Promise<void>;
  refreshAttempts: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const PAGE_SIZE = 10;

  const loadQuizzes = useCallback(async (page: number = 1) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getQuizzes(undefined, page, PAGE_SIZE);
      setQuizzes(data.items);
      setTotalPages(data.pages);
      setTotalQuizzes(data.total);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadAttempts = useCallback(async () => {
    if (!isAuthenticated) {
      setAttemptsLoading(false);
      return;
    }

    try {
      setAttemptsLoading(true);
      const data = await getAttemptsAPI();
      setAttempts(data);
    } catch (error) {
      console.error('Error loading attempts:', error);
    } finally {
      setAttemptsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes(1);
      loadAttempts();
    }
  }, [isAuthenticated]);

  const addQuiz = useCallback(async (quiz: Quiz) => {
    try {
      const quizRequest: CreateQuizRequest = {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        duration: quiz.duration,
        settings: quiz.settings
      };

      await createQuizAPI(quizRequest);
      await loadQuizzes(currentPage);
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }, [loadQuizzes, currentPage]);

  const addAttempt = useCallback((attempt: QuizAttempt) => {
    setAttempts(prev => {
      const exists = prev.find(a => a.id === attempt.id);
      if (exists) return prev;
      return [...prev, attempt];
    });
  }, []);

  const deleteQuiz = useCallback(async (id: string) => {
    try {
      await deleteQuizAPI(id);
      await loadQuizzes(currentPage);
      setAttempts(prev => prev.filter(a => a.quizId !== id));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  }, [loadQuizzes, currentPage]);

  const updateQuiz = useCallback(async (id: string, updates: UpdateQuizRequest) => {
    try {
      await updateQuizAPI(id, updates);
      await loadQuizzes(currentPage);
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  }, [loadQuizzes, currentPage]);

  const updateQuestion = useCallback(async (quizId: string, questionId: string, updates: Partial<Question>) => {
    try {
      const updateRequest: UpdateQuestionRequest = {};
      if (updates.content !== undefined) updateRequest.content = updates.content;
      if (updates.options !== undefined) updateRequest.options = updates.options;
      if (updates.correctAnswer !== undefined) updateRequest.correctAnswer = updates.correctAnswer;
      if (updates.chapter !== undefined) updateRequest.chapter = updates.chapter;
      if (updates.topic !== undefined) updateRequest.topic = updates.topic;
      if (updates.knowledgeType !== undefined) updateRequest.knowledgeType = updates.knowledgeType;
      if (updates.difficulty !== undefined) updateRequest.difficulty = updates.difficulty;
      if (updates.explanation !== undefined) updateRequest.explanation = updates.explanation;

      const updatedQuiz = await updateQuestionAPI(quizId, questionId, updateRequest);
      setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }, []);

  const deleteQuestion = useCallback(async (quizId: string, questionId: string) => {
    try {
      const updatedQuiz = await deleteQuestionAPI(quizId, questionId);
      setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }, []);

  const getQuizById = useCallback((id: string) => {
    return quizzes.find(q => q.id === id);
  }, [quizzes]);

  const loadQuizById = useCallback(async (id: string): Promise<Quiz | undefined> => {
    const local = quizzes.find(q => q.id === id);
    if (local) return local;

    try {
      const serverQuiz = await getQuizAPI(id);
      return serverQuiz;
    } catch (e) {
      console.error('Error loading quiz by id:', e);
      return undefined;
    }
  }, [quizzes]);

  const getAttemptsByStudent = useCallback((studentId: string) => {
    return attempts.filter(a => a.studentId === studentId);
  }, [attempts]);

  const getAttemptsByQuiz = useCallback((quizId: string) => {
    return attempts.filter(a => a.quizId === quizId);
  }, [attempts]);

  const getAttemptById = useCallback((id: string): QuizAttempt | undefined => {
    return attempts.find(a => a.id === id);
  }, [attempts]);

  const loadAttemptById = useCallback(async (id: string): Promise<QuizAttempt | undefined> => {
    const localAttempt = attempts.find(a => a.id === id);
    if (localAttempt) return localAttempt;

    try {
      const serverAttempt = await getAttemptAPI(id);
      setAttempts(prev => {
        const exists = prev.find(a => a.id === id);
        if (exists) return prev;
        return [...prev, serverAttempt];
      });
      return serverAttempt;
    } catch (error) {
      console.error('Error loading attempt:', error);
      return undefined;
    }
  }, [attempts]);

  const refreshQuizzes = useCallback(async () => {
    await loadQuizzes(currentPage);
  }, [loadQuizzes, currentPage]);

  const refreshAttempts = useCallback(async () => {
    await loadAttempts();
  }, [loadAttempts]);

  return (
    <DataContext.Provider value={{
      quizzes,
      attempts,
      loading,
      attemptsLoading,
      pagination: {
        currentPage,
        totalPages,
        totalQuizzes,
        pageSize: PAGE_SIZE,
        setPage: loadQuizzes
      },
      addQuiz,
      addAttempt,
      deleteQuiz,
      updateQuestion,
      deleteQuestion,
      getQuizById,
      loadQuizById,
      getAttemptsByStudent,
      getAttemptsByQuiz,
      getAttemptById,
      loadAttemptById,
      refreshQuizzes,
      refreshAttempts,
      updateQuiz
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
