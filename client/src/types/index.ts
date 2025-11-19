export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student';
  dob?: string;
  phone?: string;
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
