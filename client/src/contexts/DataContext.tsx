import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quiz, QuizAttempt, Question } from '../types';
import { useAuth } from './AuthContext';
import {
  getQuizzes,
  createQuiz as createQuizAPI,
  updateQuiz as updateQuizAPI,
  deleteQuiz as deleteQuizAPI,
  updateQuestion as updateQuestionAPI,
  deleteQuestion as deleteQuestionAPI,
  getAttempts as getAttemptsAPI,
  getAttempt as getAttemptAPI,
  CreateQuizRequest,
  UpdateQuizRequest,
  UpdateQuestionRequest
} from '../services/api';

interface DataContextType {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  loading: boolean;
  attemptsLoading: boolean;
  addQuiz: (quiz: Quiz) => Promise<void>;
  addAttempt: (attempt: QuizAttempt) => void;
  deleteQuiz: (id: string) => Promise<void>;
  updateQuestion: (quizId: string, questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (quizId: string, questionId: string) => Promise<void>;
  getQuizById: (id: string) => Quiz | undefined;
  getAttemptsByStudent: (studentId: string) => QuizAttempt[];
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getAttemptById: (id: string) => QuizAttempt | undefined;
  loadAttemptById: (id: string) => Promise<QuizAttempt | undefined>;
  refreshQuizzes: () => Promise<void>;
  refreshAttempts: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(true);

  const loadQuizzes = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getQuizzes();
      setQuizzes(data);
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
      loadQuizzes();
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
      
      const createdQuiz = await createQuizAPI(quizRequest);
      setQuizzes(prev => [...prev, createdQuiz]);
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
      setQuizzes(prev => prev.filter(q => q.id !== id));
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
    await loadQuizzes();
  };

  const refreshAttempts = async () => {
    await loadAttempts();
  };

  return (
    <DataContext.Provider value={{
      quizzes,
      attempts,
      loading,
      addQuiz,
      addAttempt,
      deleteQuiz,
      updateQuestion,
      deleteQuestion,
      getQuizById,
      getAttemptsByStudent,
      getAttemptsByQuiz,
      getAttemptById,
      loadAttemptById,
      refreshQuizzes,
      refreshAttempts,
      attemptsLoading
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
