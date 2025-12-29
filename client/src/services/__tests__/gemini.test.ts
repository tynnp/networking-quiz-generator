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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    generateQuestions,
    analyzeResult,
    analyzeOverall,
    analyzeProgress,
} from '../gemini';
import * as api from '../api';

// Mock the apiRequest function
vi.mock('../api', () => ({
    apiRequest: vi.fn(),
}));

describe('Gemini Service', () => {
    const mockApiRequest = api.apiRequest as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('generateQuestions', () => {
        it('gọi apiRequest với tham số đúng', async () => {
            const mockQuestions = [
                {
                    id: 'q1',
                    content: 'What is TCP?',
                    options: ['A', 'B', 'C', 'D'],
                    correctAnswer: 0,
                    chapter: 'Ch1',
                    topic: 'Networking',
                    knowledgeType: 'concept',
                    difficulty: 'easy',
                },
            ];

            mockApiRequest.mockResolvedValueOnce({ questions: mockQuestions });

            const params = {
                chapter: 'Chapter 1',
                topics: ['TCP/IP'],
                knowledgeTypes: ['concept'],
                difficulty: 'easy',
                count: 5,
            };

            const result = await generateQuestions(params);

            expect(mockApiRequest).toHaveBeenCalledWith('/api/generate-questions', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            expect(result).toEqual(mockQuestions);
        });

        it('ném lỗi khi API thất bại', async () => {
            const error = new Error('API Error');
            mockApiRequest.mockRejectedValueOnce(error);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await expect(
                generateQuestions({ count: 5 })
            ).rejects.toThrow('API Error');

            expect(consoleSpy).toHaveBeenCalledWith('Error generating questions:', error);
            consoleSpy.mockRestore();
        });

        it('hoạt động với tham số tối thiểu', async () => {
            mockApiRequest.mockResolvedValueOnce({ questions: [] });

            const result = await generateQuestions({ count: 10 });

            expect(mockApiRequest).toHaveBeenCalledWith('/api/generate-questions', {
                method: 'POST',
                body: JSON.stringify({ count: 10 }),
            });
            expect(result).toEqual([]);
        });

        it('xử lý khi API trả về undefined', async () => {
            mockApiRequest.mockResolvedValueOnce({ questions: undefined });

            const result = await generateQuestions({ count: 5 });

            // Hàm generateQuestions trả về data.questions, nếu API trả về { questions: undefined }
            // thì result sẽ là undefined. Trong thực tế cần check lại gemini.ts xem có xử lý này không.
            // Dựa trên code hiện tại: return data.questions; -> undefined
            expect(result).toBeUndefined();
        });
    });

    describe('analyzeResult', () => {
        const mockFeedback = {
            overallFeedback: 'Good job!',
            strengths: ['TCP knowledge'],
            weaknesses: ['UDP concepts'],
            suggestedTopics: ['Network protocols'],
            suggestedNextActions: ['Practice more'],
        };

        it('gọi apiRequest với tham số đúng', async () => {
            mockApiRequest.mockResolvedValueOnce(mockFeedback);

            const params = {
                quizTitle: 'Test Quiz',
                questions: [],
                answers: { q1: 0 },
                score: 80,
                timeSpent: 600,
            };

            const result = await analyzeResult(params);

            expect(mockApiRequest).toHaveBeenCalledWith('/api/analyze-result', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            expect(result).toEqual(mockFeedback);
        });

        it('ném lỗi khi API thất bại', async () => {
            const error = new Error('Analysis failed');
            mockApiRequest.mockRejectedValueOnce(error);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await expect(
                analyzeResult({
                    quizTitle: 'Test',
                    questions: [],
                    answers: {},
                    score: 0,
                    timeSpent: 0,
                })
            ).rejects.toThrow('Analysis failed');

            expect(consoleSpy).toHaveBeenCalledWith('Error analyzing result:', error);
            consoleSpy.mockRestore();
        });
    });

    describe('analyzeOverall', () => {
        const mockFeedback = {
            overallFeedback: 'Overall good performance',
            strengths: ['Consistent studying'],
            weaknesses: ['Time management'],
            suggestedTopics: ['Advanced topics'],
            suggestedNextActions: ['Take more quizzes'],
        };

        it('gọi apiRequest với tham số đúng', async () => {
            mockApiRequest.mockResolvedValueOnce(mockFeedback);

            const params = {
                studentName: 'Test Student',
                attemptCount: 10,
                avgScore: 75,
                knowledgeAnalysis: [
                    {
                        knowledgeType: 'concept',
                        chapter: 'Ch1',
                        topic: 'Topic1',
                        totalQuestions: 10,
                        correctAnswers: 8,
                        accuracy: 80,
                    },
                ],
            };

            const result = await analyzeOverall(params);

            expect(mockApiRequest).toHaveBeenCalledWith('/api/analyze-overall', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            expect(result).toEqual(mockFeedback);
        });

        it('hoạt động không cần studentName', async () => {
            mockApiRequest.mockResolvedValueOnce(mockFeedback);

            const params = {
                attemptCount: 5,
                avgScore: 60,
                knowledgeAnalysis: [],
            };

            const result = await analyzeOverall(params);

            expect(result).toEqual(mockFeedback);
        });

        it('ném lỗi khi API thất bại', async () => {
            const error = new Error('Overall analysis failed');
            mockApiRequest.mockRejectedValueOnce(error);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await expect(
                analyzeOverall({
                    attemptCount: 0,
                    avgScore: 0,
                    knowledgeAnalysis: [],
                })
            ).rejects.toThrow('Overall analysis failed');

            expect(consoleSpy).toHaveBeenCalledWith('Error analyzing overall results:', error);
            consoleSpy.mockRestore();
        });
    });

    describe('analyzeProgress', () => {
        const mockFeedback = {
            overallFeedback: 'You are improving!',
            strengths: ['Consistent practice'],
            weaknesses: ['Speed'],
            suggestedTopics: ['Advanced networking'],
            suggestedNextActions: ['Challenge yourself'],
        };

        it('gọi apiRequest với tham số đúng cho xu hướng tiến bộ', async () => {
            mockApiRequest.mockResolvedValueOnce(mockFeedback);

            const params = {
                studentName: 'Test Student',
                chapter: 'Chapter 1',
                progressData: [
                    { date: '2025-01-01', score: 70, quizTitle: 'Quiz 1' },
                    { date: '2025-01-02', score: 80, quizTitle: 'Quiz 2' },
                ],
                avgScore: 75,
                trend: 'improving' as const,
            };

            const result = await analyzeProgress(params);

            expect(mockApiRequest).toHaveBeenCalledWith('/api/analyze-progress', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            expect(result).toEqual(mockFeedback);
        });

        it('xử lý xu hướng giảm sút', async () => {
            mockApiRequest.mockResolvedValueOnce(mockFeedback);

            const params = {
                chapter: 'Chapter 2',
                progressData: [
                    { date: '2025-01-01', score: 90, quizTitle: 'Quiz 1' },
                    { date: '2025-01-02', score: 70, quizTitle: 'Quiz 2' },
                ],
                avgScore: 80,
                trend: 'declining' as const,
            };

            await analyzeProgress(params);

            expect(mockApiRequest).toHaveBeenCalledWith(
                '/api/analyze-progress',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('xử lý xu hướng ổn định', async () => {
            mockApiRequest.mockResolvedValueOnce(mockFeedback);

            const params = {
                chapter: 'Chapter 3',
                progressData: [
                    { date: '2025-01-01', score: 75, quizTitle: 'Quiz 1' },
                    { date: '2025-01-02', score: 75, quizTitle: 'Quiz 2' },
                ],
                avgScore: 75,
                trend: 'stable' as const,
            };

            await analyzeProgress(params);

            expect(mockApiRequest).toHaveBeenCalled();
        });

        it('ném lỗi khi API thất bại', async () => {
            const error = new Error('Progress analysis failed');
            mockApiRequest.mockRejectedValueOnce(error);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await expect(
                analyzeProgress({
                    chapter: 'Ch1',
                    progressData: [],
                    avgScore: 0,
                    trend: 'stable',
                })
            ).rejects.toThrow('Progress analysis failed');

            expect(consoleSpy).toHaveBeenCalledWith('Error analyzing progress:', error);
            consoleSpy.mockRestore();
        });
    });
});
