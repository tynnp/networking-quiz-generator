import { Question, AiResultFeedback, KnowledgeAnalysis } from '../types';

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
    const response = await fetch('http://localhost:8000/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const data = await response.json();
    return data.questions as Question[];
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

export async function analyzeResult(params: AnalyzeResultParams): Promise<AiResultFeedback> {
  try {
    const response = await fetch('http://localhost:8000/api/analyze-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze result');
    }

    const data = await response.json();
    return data as AiResultFeedback;
  } catch (error) {
    console.error('Error analyzing result:', error);
    throw error;
  }
}

export async function analyzeOverall(params: AnalyzeOverallParams): Promise<AiResultFeedback> {
  try {
    const response = await fetch('http://localhost:8000/api/analyze-overall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze overall results');
    }

    const data = await response.json();
    return data as AiResultFeedback;
  } catch (error) {
    console.error('Error analyzing overall results:', error);
    throw error;
  }
}
