import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { KnowledgeAnalysis, QuizAttempt, AiResultFeedback as AiResultFeedbackType } from '../types';
import { analyzeOverall } from '../services/gemini';

interface AnalyticsProps {
  onAiAnalyzeAttempt?: (attemptId: string) => void;
}

export default function Analytics({ onAiAnalyzeAttempt }: AnalyticsProps) {
  const { quizzes, attempts } = useData();
  const { user } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [overallFeedback, setOverallFeedback] = useState<AiResultFeedbackType | null>(null);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  const analyzeQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return null;

    const quizAttempts = attempts.filter(a => a.quizId === quizId);
    if (quizAttempts.length === 0) return null;

    const avgScore = quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length;
    const maxScore = Math.max(...quizAttempts.map(a => a.score));
    const minScore = Math.min(...quizAttempts.map(a => a.score));

    const knowledgeAnalysis: KnowledgeAnalysis[] = [];
    quiz.questions.forEach(question => {
      const existingAnalysis = knowledgeAnalysis.find(
        a => a.knowledgeType === question.knowledgeType &&
             a.chapter === question.chapter &&
             a.topic === question.topic
      );

      const correctCount = quizAttempts.filter(
        attempt => attempt.answers[question.id] === question.correctAnswer
      ).length;

      if (existingAnalysis) {
        existingAnalysis.totalQuestions++;
        existingAnalysis.correctAnswers += correctCount;
        existingAnalysis.accuracy = (existingAnalysis.correctAnswers / (existingAnalysis.totalQuestions * quizAttempts.length)) * 100;
      } else {
        knowledgeAnalysis.push({
          knowledgeType: question.knowledgeType,
          chapter: question.chapter,
          topic: question.topic,
          totalQuestions: 1,
          correctAnswers: correctCount,
          accuracy: (correctCount / quizAttempts.length) * 100
        });
      }
    });

    return {
      quiz,
      attemptCount: quizAttempts.length,
      avgScore: avgScore.toFixed(1),
      maxScore: maxScore.toFixed(1),
      minScore: minScore.toFixed(1),
      knowledgeAnalysis
    };
  };

  const analyzeStudent = (studentId: string) => {
    const studentAttempts = attempts.filter(a => a.studentId === studentId);
    if (studentAttempts.length === 0) return null;

    const avgScore = studentAttempts.reduce((sum, a) => sum + a.score, 0) / studentAttempts.length;

    const knowledgeMap = new Map<string, { total: number; correct: number }>();

    studentAttempts.forEach(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      if (!quiz) return;

      quiz.questions.forEach(question => {
        const key = `${question.knowledgeType}::${question.chapter}::${question.topic}`;
        const existing = knowledgeMap.get(key) || { total: 0, correct: 0 };

        existing.total++;
        if (attempt.answers[question.id] === question.correctAnswer) {
          existing.correct++;
        }

        knowledgeMap.set(key, existing);
      });
    });

    const knowledgeAnalysis: KnowledgeAnalysis[] = Array.from(knowledgeMap.entries()).map(([key, data]) => {
      const [knowledgeType, chapter, topic] = key.split('::');
      return {
        knowledgeType,
        chapter,
        topic,
        totalQuestions: data.total,
        correctAnswers: data.correct,
        accuracy: (data.correct / data.total) * 100
      };
    });

    return {
      attemptCount: studentAttempts.length,
      avgScore: avgScore.toFixed(1),
      knowledgeAnalysis: knowledgeAnalysis.sort((a, b) => a.accuracy - b.accuracy)
    };
  };

  const getKnowledgeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      concept: 'Khái niệm',
      property: 'Tính chất',
      mechanism: 'Cơ chế hoạt động',
      rule: 'Quy tắc và tiêu chuẩn',
      scenario: 'Tình huống',
      example: 'Bài tập tính toán'
    };
    return labels[type] || type;
  };

  const quizAnalysis = selectedQuiz ? analyzeQuiz(selectedQuiz) : null;
  const studentAnalysis = user ? analyzeStudent(user.id) : null;

  const handleAiAnalysis = async () => {
    if (!user) {
      alert('Bạn cần đăng nhập để sử dụng phân tích với AI.');
      return;
    }

    const myAttempts = attempts.filter(a => a.studentId === user.id);

    if (myAttempts.length === 0) {
      alert('Bạn chưa có bài làm nào để phân tích. Hãy làm ít nhất một bài kiểm tra trước.');
      return;
    }

    // Nếu đang chọn một đề thi cụ thể: phân tích theo bài làm gần nhất của đề đó (giữ nguyên flow cũ)
    if (selectedQuiz) {
      let targetAttempt: QuizAttempt | undefined;

      const myQuizAttempts = myAttempts.filter(a => a.quizId === selectedQuiz);

      if (myQuizAttempts.length === 0) {
        alert('Bạn chưa có bài làm nào cho đề thi này. Hãy làm đề thi trước khi phân tích với AI.');
        return;
      }

      targetAttempt = myQuizAttempts[myQuizAttempts.length - 1];

      if (!onAiAnalyzeAttempt) {
        alert('Chức năng điều hướng đến màn hình phân tích với AI chưa được cấu hình.');
        return;
      }

      onAiAnalyzeAttempt(targetAttempt.id);
      return;
    }

    // Không chọn đề thi: AI phân tích tổng quan toàn bộ lịch sử làm bài
    if (!studentAnalysis) {
      alert('Không có dữ liệu phân tích tổng quan. Hãy làm ít nhất một bài kiểm tra.');
      return;
    }

    try {
      setOverallLoading(true);
      setOverallError(null);
      setOverallFeedback(null);

      const avgScoreValue =
        typeof studentAnalysis.avgScore === 'number'
          ? studentAnalysis.avgScore
          : parseFloat(studentAnalysis.avgScore as string);

      const result = await analyzeOverall({
        studentName: user.name,
        attemptCount: studentAnalysis.attemptCount,
        avgScore: avgScoreValue,
        knowledgeAnalysis: studentAnalysis.knowledgeAnalysis,
      });

      setOverallFeedback(result);
    } catch (error) {
      console.error('Error analyzing overall results with AI:', error);
      setOverallError('Không thể phân tích tổng quan bằng AI. Vui lòng thử lại sau.');
    } finally {
      setOverallLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">PHÂN TÍCH KIẾN THỨC BẰNG AI</h2>
      </div>
      <div className="bg-white rounded-xl shadow-md p-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phân tích theo bài kiểm tra
            </label>
            <select
              value={selectedQuiz}
              onChange={(e) => {
                setSelectedQuiz(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
            >
              <option value="">Chọn đề thi</option>
              {quizzes.map(quiz => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAiAnalysis}
              disabled={!quizAnalysis && !studentAnalysis}
              className="w-full px-4 py-2 bg-[#124874] text-white text-sm font-medium rounded-lg hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Phân tích với AI
            </button>
          </div>
        </div>

        {quizAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#124874] rounded"></div>
              <h3 className="text-lg font-semibold text-gray-800">Phân tích đề thi</h3>
              <span className="text-sm text-gray-500">- {quizAnalysis.quiz.title}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Số lượt thi</p>
                <p className="text-2xl font-bold text-[#124874]">{quizAnalysis.attemptCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Điểm TB</p>
                <p className="text-2xl font-bold text-green-700">{quizAnalysis.avgScore}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Điểm cao nhất</p>
                <p className="text-2xl font-bold text-yellow-700">{quizAnalysis.maxScore}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Điểm thấp nhất</p>
                <p className="text-2xl font-bold text-red-700">{quizAnalysis.minScore}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2 text-sm">
                Phân tích kiến thức
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quizAnalysis.knowledgeAnalysis.map((analysis, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                        {analysis.topic}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analysis.chapter} - {getKnowledgeTypeLabel(analysis.knowledgeType)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              analysis.accuracy >= 70 ? 'bg-green-500' :
                              analysis.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          analysis.accuracy >= 70 ? 'text-green-600' :
                          analysis.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analysis.accuracy.toFixed(1)}%
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {analysis.correctAnswers}/{analysis.totalQuestions * quizAnalysis.attemptCount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {quizAnalysis && studentAnalysis && (
          <div className="border-t border-gray-200 my-6"></div>
        )}

        {studentAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#124874] rounded"></div>
              <h3 className="text-lg font-semibold text-gray-800">Phân tích cá nhân</h3>
              <span className="text-sm text-gray-500">- {user?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Số bài đã làm</p>
                <p className="text-2xl font-bold text-[#124874]">{studentAnalysis.attemptCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Điểm trung bình</p>
                <p className="text-2xl font-bold text-green-700">{studentAnalysis.avgScore}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2 text-sm">
                Kiến thức cần cải thiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studentAnalysis.knowledgeAnalysis.slice(0, 5).map((analysis, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                        {analysis.topic}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analysis.chapter} - {getKnowledgeTypeLabel(analysis.knowledgeType)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              analysis.accuracy >= 70 ? 'bg-green-500' :
                              analysis.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          analysis.accuracy >= 70 ? 'text-green-600' :
                          analysis.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analysis.accuracy.toFixed(1)}%
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {analysis.correctAnswers}/{analysis.totalQuestions}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {overallLoading && (
              <div className="mt-4 text-sm text-gray-500">
                Đang phân tích tổng quan lịch sử làm bài bằng AI...
              </div>
            )}

            {overallError && (
              <div className="mt-4 text-sm text-red-600">
                {overallError}
              </div>
            )}

            {overallFeedback && !overallLoading && !overallError && (
              <div className="mt-4 border-t border-gray-200 pt-4 space-y-3 text-sm">
                <h4 className="font-semibold text-[#124874]">Nhận xét tổng quan từ AI</h4>
                <p className="text-gray-700 whitespace-pre-line">
                  {overallFeedback.overallFeedback}
                </p>

                {(overallFeedback.strengths.length > 0 || overallFeedback.weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-green-700 mb-2 text-sm">Điểm mạnh chính</h5>
                      {overallFeedback.strengths.length === 0 ? (
                        <p className="text-gray-500 text-xs">Chưa có thông tin cụ thể.</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                          {overallFeedback.strengths.slice(0, 4).map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h5 className="font-semibold text-red-700 mb-2 text-sm">Điểm cần cải thiện</h5>
                      {overallFeedback.weaknesses.length === 0 ? (
                        <p className="text-gray-500 text-xs">Chưa có thông tin cụ thể.</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                          {overallFeedback.weaknesses.slice(0, 4).map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {overallFeedback.suggestedTopics.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-[#124874] mb-1 text-sm">Chủ đề nên ưu tiên ôn</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                      {overallFeedback.suggestedTopics.slice(0, 5).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {overallFeedback.suggestedNextActions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-[#124874] mb-1 text-sm">Hành động gợi ý tiếp theo</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                      {overallFeedback.suggestedNextActions.slice(0, 5).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!quizAnalysis && !studentAnalysis && (
          <div className="text-center py-12 text-gray-500">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Chưa có dữ liệu phân tích</p>
            <p className="text-sm">Chọn đề thi hoặc làm ít nhất một bài kiểm tra để xem phân tích</p>
          </div>
        )}
      </div>
    </div>
  );
}
