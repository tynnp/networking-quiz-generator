import { Question, AiResultFeedback, KnowledgeAnalysis } from '../types';
import { apiRequest } from './api';

interface GenerateQuestionsParams {
  chapter?: string;
  topics?: string[];
  knowledgeTypes?: string[];
  difficulty?: string;
  count: number;
}

interface AnalyzeResultParams {
  quizTitle: string;
  questions: Question[];
  answers: { [questionId: string]: number };
  score: number;
  timeSpent: number;
}

interface AnalyzeOverallParams {
  studentName?: string;
  attemptCount: number;
  avgScore: number;
  knowledgeAnalysis: KnowledgeAnalysis[];
}

export async function generateQuestions(params: GenerateQuestionsParams): Promise<Question[]> {
  try {
    const data = await apiRequest<{ questions: Question[] }>('/api/generate-questions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data.questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

export async function analyzeResult(params: AnalyzeResultParams): Promise<AiResultFeedback> {
  try {
    const data = await apiRequest<AiResultFeedback>('/api/analyze-result', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  } catch (error) {
    console.error('Error analyzing result:', error);
    throw error;
  }
}

export async function analyzeOverall(params: AnalyzeOverallParams): Promise<AiResultFeedback> {
  try {
    const data = await apiRequest<AiResultFeedback>('/api/analyze-overall', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  } catch (error) {
    console.error('Error analyzing overall results:', error);
    throw error;
  }
}
