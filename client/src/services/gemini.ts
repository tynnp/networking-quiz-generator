import { Question } from '../types';

interface GenerateQuestionsParams {
  chapter?: string;
  topics?: string[];
  knowledgeTypes?: string[];
  difficulty?: string;
  count: number;
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
