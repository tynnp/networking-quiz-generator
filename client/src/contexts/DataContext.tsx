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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mockQuestions: Question[] = [
  {
    id: 'q1',
    content: 'Giao thức TCP hoạt động ở tầng nào trong mô hình OSI?',
    options: ['Tầng Vật lý', 'Tầng Liên kết dữ liệu', 'Tầng Mạng', 'Tầng Giao vận'],
    correctAnswer: 3,
    chapter: 'Chương 1',
    topic: 'Mô hình OSI',
    knowledgeType: 'concept',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    content: 'Địa chỉ IP nào sau đây là địa chỉ IP private?',
    options: ['8.8.8.8', '192.168.1.1', '1.1.1.1', '172.217.0.0'],
    correctAnswer: 1,
    chapter: 'Chương 2',
    topic: 'Địa chỉ IP',
    knowledgeType: 'concept',
    difficulty: 'medium'
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: '1',
      title: 'Kiểm tra Chương 1 - Mô hình OSI',
      description: 'Bài kiểm tra về mô hình OSI và các tầng giao thức',
      questions: mockQuestions,
      duration: 30,
      createdBy: '1',
      createdAt: new Date(),
      settings: {
        chapter: 'Chương 1',
        questionCount: 2
      }
    }
  ]);

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
      getAttemptsByQuiz
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
