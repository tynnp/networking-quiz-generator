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

interface ProgressDataPoint {
  date: string;
  score: number;
  quizTitle: string;
}

interface AnalyzeProgressParams {
  studentName?: string;
  chapter: string;
  progressData: ProgressDataPoint[];
  avgScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

export async function analyzeProgress(params: AnalyzeProgressParams): Promise<AiResultFeedback> {
  try {
    const data = await apiRequest<AiResultFeedback>('/api/analyze-progress', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  } catch (error) {
    console.error('Error analyzing progress:', error);
    throw error;
  }
}
