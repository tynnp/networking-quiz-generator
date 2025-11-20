import { createContext, useContext, useState, ReactNode } from 'react';
import { Quiz, QuizAttempt, Question } from '../types';

interface DataContextType {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  addQuiz: (quiz: Quiz) => void;
  addAttempt: (attempt: QuizAttempt) => void;
  deleteQuiz: (id: string) => void;
  updateQuestion: (quizId: string, questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  getQuizById: (id: string) => Quiz | undefined;
  getAttemptsByStudent: (studentId: string) => QuizAttempt[];
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getAttemptById: (id: string) => QuizAttempt | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const addQuiz = (quiz: Quiz) => {
    setQuizzes(prev => [...prev, quiz]);
  };

  const addAttempt = (attempt: QuizAttempt) => {
    setAttempts(prev => [...prev, attempt]);
  };

  const deleteQuiz = (id: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== id));
    setAttempts(prev => prev.filter(a => a.quizId !== id));
  };

  const updateQuestion = (quizId: string, questionId: string, updates: Partial<Question>) => {
    setQuizzes(prev => prev.map(quiz => {
      if (quiz.id !== quizId) return quiz;
      return {
        ...quiz,
        questions: quiz.questions.map(question =>
          question.id === questionId ? { ...question, ...updates } : question
        )
      };
    }));
  };

  const deleteQuestion = (quizId: string, questionId: string) => {
    setQuizzes(prev => prev.map(quiz => {
      if (quiz.id !== quizId) return quiz;
      const newQuestions = quiz.questions.filter(question => question.id !== questionId);
      return {
        ...quiz,
        questions: newQuestions,
        settings: {
          ...quiz.settings,
          questionCount: newQuestions.length
        }
      };
    }));
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

  const getAttemptById = (id: string) => {
    return attempts.find(a => a.id === id);
  };

  return (
    <DataContext.Provider value={{
      quizzes,
      attempts,
      addQuiz,
      addAttempt,
      deleteQuiz,
      updateQuestion,
      deleteQuestion,
      getQuizById,
      getAttemptsByStudent,
      getAttemptsByQuiz,
      getAttemptById
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
