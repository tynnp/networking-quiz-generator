import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  UpdateQuestionRequest
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const PAGE_SIZE = 10;

  const loadQuizzes = async (page: number = 1) => {
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
  };

  const loadAttempts = async () => {
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
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes(1);
      loadAttempts();
    }
  }, [isAuthenticated]);

  const addQuiz = async (quiz: Quiz) => {
    try {
      const quizRequest: CreateQuizRequest = {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        duration: quiz.duration,
        settings: quiz.settings
      };

      await createQuizAPI(quizRequest);
      // Reload current page to see update (or reset to 1)
      await loadQuizzes(currentPage);
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  };

  const addAttempt = (attempt: QuizAttempt) => {
    // Check if attempt already exists (from server)
    setAttempts(prev => {
      const exists = prev.find(a => a.id === attempt.id);
      if (exists) return prev;
      return [...prev, attempt];
    });
  };

  const deleteQuiz = async (id: string) => {
    try {
      await deleteQuizAPI(id);
      // Reload current page
      await loadQuizzes(currentPage);
      setAttempts(prev => prev.filter(a => a.quizId !== id));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  };

  const updateQuestion = async (quizId: string, questionId: string, updates: Partial<Question>) => {
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
  };

  const deleteQuestion = async (quizId: string, questionId: string) => {
    try {
      const updatedQuiz = await deleteQuestionAPI(quizId, questionId);
      setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  };

  const getQuizById = (id: string) => {
    return quizzes.find(q => q.id === id);
  };

  const loadQuizById = async (id: string): Promise<Quiz | undefined> => {
    // Check local
    const local = quizzes.find(q => q.id === id);
    if (local) return local;

    // Fetch from server
    try {
      const serverQuiz = await getQuizAPI(id);
      // We don't add it to the 'quizzes' list to avoid messing up pagination view
      // But components can use the returned value.
      // Optionally we could have a cache for 'loadedQuizzes' but let's keep it simple.
      return serverQuiz;
    } catch (e) {
      console.error('Error loading quiz by id:', e);
      return undefined;
    }
  };

  const getAttemptsByStudent = (studentId: string) => {
    return attempts.filter(a => a.studentId === studentId);
  };

  const getAttemptsByQuiz = (quizId: string) => {
    return attempts.filter(a => a.quizId === quizId);
  };

  const getAttemptById = (id: string): QuizAttempt | undefined => {
    return attempts.find(a => a.id === id);
  };

  const loadAttemptById = async (id: string): Promise<QuizAttempt | undefined> => {
    // First check local state
    const localAttempt = attempts.find(a => a.id === id);
    if (localAttempt) return localAttempt;

    // If not found, try to load from server
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
  };

  const refreshQuizzes = async () => {
    await loadQuizzes(currentPage);
  };

  const refreshAttempts = async () => {
    await loadAttempts();
  };

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
      refreshAttempts
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
