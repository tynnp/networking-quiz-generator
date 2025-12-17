export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  dob?: string;
  phone?: string;
  isLocked?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Question {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  chapter: string;
  topic: string;
  knowledgeType: 'concept' | 'property' | 'mechanism' | 'rule' | 'scenario' | 'example';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  duration: number;
  createdBy: string;
  createdAt: Date;
  settings: {
    chapter?: string;
    topic?: string;
    knowledgeTypes?: string[];
    difficulty?: string;
    questionCount: number;
  };
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: { [questionId: string]: number };
  score: number;
  completedAt: Date;
  timeSpent: number;
}

export interface KnowledgeAnalysis {
  knowledgeType: string;
  chapter: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export interface AiResultFeedback {
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestedTopics: string[];
  suggestedNextActions: string[];
}

export interface AnalysisHistory {
  id: string;
  userId: string;
  analysisType: 'result' | 'overall' | 'progress';
  title: string;
  result: AiResultFeedback;
  context?: Record<string, unknown>;
  createdAt: Date;
}
