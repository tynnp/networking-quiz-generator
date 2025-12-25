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

import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { analyzeResult } from '../services/gemini';
import type { AiResultFeedback, QuizAttempt, Quiz } from '../types';
import ReactMarkdown from 'react-markdown';

interface AiResultFeedbackProps {
  attemptId: string;
  onViewDetail: () => void;
  onBack: () => void;
}

export default function AiResultFeedback({ attemptId, onViewDetail, onBack }: AiResultFeedbackProps) {
  const { getAttemptById, getQuizById } = useData();
  const [feedback, setFeedback] = useState<AiResultFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attempt = getAttemptById(attemptId) as QuizAttempt | undefined;
  const quiz = attempt ? (getQuizById(attempt.quizId) as Quiz | undefined) : undefined;

  useEffect(() => {
    const run = async () => {
      if (!attempt || !quiz) {
        setError('Không tìm thấy thông tin bài làm hoặc đề thi');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await analyzeResult({
          quizTitle: quiz.title,
          questions: quiz.questions,
          answers: attempt.answers,
          score: attempt.score,
          timeSpent: attempt.timeSpent,
        });

        setFeedback(result);
      } catch (err) {
        setError('Không thể phân tích kết quả bài làm. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [attempt, quiz]);

  if (!attempt || !quiz) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-center text-gray-500">Không tìm thấy bài làm</p>
          <div className="mt-4 flex justify-center gap-3 text-sm">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">PHÂN TÍCH KẾT QUẢ BÀI LÀM BẰNG AI</h2>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#124874] mb-1">{quiz.title}</h3>
            <p className="text-sm text-gray-600">
              Điểm: <span className="font-semibold">{attempt.score.toFixed(1)}</span>/100
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-gray-500 text-sm">
            Đang phân tích kết quả bài làm bằng AI...
          </div>
        )}

        {!isLoading && error && (
          <div className="py-4 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {!isLoading && !error && feedback && (
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold text-[#124874] mb-2">Nhận xét tổng quan</h4>
              <div className="text-gray-700 prose prose-sm max-w-none">
                <ReactMarkdown>{feedback.overallFeedback}</ReactMarkdown>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Điểm mạnh</h4>
                {feedback.strengths.length === 0 ? (
                  <p className="text-gray-500">Chưa có thông tin cụ thể.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {feedback.strengths.map((item, index) => (
                      <li key={index} className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {item}
                        </ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-red-700 mb-2">Điểm cần cải thiện</h4>
                {feedback.weaknesses.length === 0 ? (
                  <p className="text-gray-500">Chưa có thông tin cụ thể.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {feedback.weaknesses.map((item, index) => (
                      <li key={index} className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {item}
                        </ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-[#124874] mb-2">Chủ đề nên ôn luyện</h4>
                {feedback.suggestedTopics.length === 0 ? (
                  <p className="text-gray-500">Chưa có gợi ý cụ thể.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {feedback.suggestedTopics.map((item, index) => (
                      <li key={index} className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {item}
                        </ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-[#124874] mb-2">Hành động gợi ý tiếp theo</h4>
                {feedback.suggestedNextActions.length === 0 ? (
                  <p className="text-gray-500">Chưa có gợi ý cụ thể.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {feedback.suggestedNextActions.map((item, index) => (
                      <li key={index} className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {item}
                        </ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Quay lại kết quả của tôi
          </button>

          <button
            type="button"
            onClick={onViewDetail}
            className="px-4 py-2 rounded-lg bg-[#124874] text-white hover:bg-[#0d3351]"
          >
            Xem chi tiết từng câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
}
