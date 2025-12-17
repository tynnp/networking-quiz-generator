import { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { KnowledgeAnalysis, QuizAttempt, AiResultFeedback as AiResultFeedbackType, Quiz } from '../types';
import { analyzeOverall, analyzeProgress } from '../services/gemini';
import { getQuizzes } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalyticsProps {
  onAiAnalyzeAttempt?: (attemptId: string) => void;
}

export default function Analytics({ onAiAnalyzeAttempt }: AnalyticsProps) {
  const { attempts } = useData();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    // Load all quizzes for dropdown (limit 100 for now)
    getQuizzes(undefined, 1, 100).then(data => {
      setQuizzes(data.items);
    }).catch(console.error);
  }, []);

  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [overallFeedback, setOverallFeedback] = useState<AiResultFeedbackType | null>(null);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  // Progress tracking state
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [progressFeedback, setProgressFeedback] = useState<AiResultFeedbackType | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Get unique chapters from quizzes
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    quizzes.forEach(quiz => {
      if (quiz.settings.chapter) {
        chapters.add(quiz.settings.chapter);
      }
    });
    return Array.from(chapters).sort();
  }, [quizzes]);

  // Calculate progress data for selected chapter
  const progressData = useMemo(() => {
    if (!selectedChapter || !user) return null;

    // Find quizzes with this chapter
    const chapterQuizzes = quizzes.filter(q => q.settings.chapter === selectedChapter);
    if (chapterQuizzes.length === 0) return null;

    // Get attempts for these quizzes
    const chapterAttempts = attempts
      .filter(a => a.studentId === user.id && chapterQuizzes.some(q => q.id === a.quizId))
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

    if (chapterAttempts.length === 0) return null;

    const dataPoints = chapterAttempts.map(attempt => {
      const quiz = chapterQuizzes.find(q => q.id === attempt.quizId);
      return {
        date: new Date(attempt.completedAt).toLocaleDateString('vi-VN'),
        score: attempt.score,
        quizTitle: quiz?.title || 'Không xác định'
      };
    });

    const avgScore = dataPoints.reduce((sum, p) => sum + p.score, 0) / dataPoints.length;

    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (dataPoints.length >= 2) {
      const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
      const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
      const firstAvg = firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;

      if (secondAvg - firstAvg > 5) trend = 'improving';
      else if (firstAvg - secondAvg > 5) trend = 'declining';
    }

    return {
      dataPoints,
      avgScore,
      trend,
      attemptCount: chapterAttempts.length
    };
  }, [selectedChapter, quizzes, attempts, user]);

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
        a => a.chapter === question.chapter &&
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
          knowledgeType: '', // Không cần hiển thị
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
        const key = `${question.chapter}::${question.topic}`;
        const existing = knowledgeMap.get(key) || { total: 0, correct: 0 };

        existing.total++;
        if (attempt.answers[question.id] === question.correctAnswer) {
          existing.correct++;
        }

        knowledgeMap.set(key, existing);
      });
    });

    const knowledgeAnalysis: KnowledgeAnalysis[] = Array.from(knowledgeMap.entries()).map(([key, data]) => {
      const [chapter, topic] = key.split('::');
      return {
        knowledgeType: '',
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

      myQuizAttempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      targetAttempt = myQuizAttempts[0];

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
      <div className="bg-white rounded-xl shadow-md p-3 md:p-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Phân tích theo bài kiểm tra
            </label>
            <select
              value={selectedQuiz}
              onChange={(e) => {
                setSelectedQuiz(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-xs md:text-sm"
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
              className="w-full px-4 py-2 bg-[#124874] text-white text-xs md:text-sm font-medium rounded-lg hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Phân tích với AI
            </button>
          </div>
        </div>

        {quizAnalysis && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#124874] rounded"></div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">Phân tích đề thi</h3>
              <span className="text-xs md:text-sm text-gray-500">- {quizAnalysis.quiz.title}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1">Số lượt thi</p>
                <p className="text-xl md:text-2xl font-bold text-[#124874]">{quizAnalysis.attemptCount}</p>
              </div>
              <div className="bg-green-50 p-2 md:p-3 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1">Điểm TB</p>
                <p className="text-xl md:text-2xl font-bold text-green-700">{quizAnalysis.avgScore}</p>
              </div>
              <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1">Điểm cao nhất</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-700">{quizAnalysis.maxScore}</p>
              </div>
              <div className="bg-red-50 p-2 md:p-3 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1">Điểm thấp nhất</p>
                <p className="text-xl md:text-2xl font-bold text-red-700">{quizAnalysis.minScore}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2 text-xs md:text-sm">
                Phân tích kiến thức
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {quizAnalysis.knowledgeAnalysis.map((analysis, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-2 md:p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2">
                        {analysis.topic}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500">
                        {analysis.chapter}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 md:gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                          <div
                            className={`h-1.5 md:h-2 rounded-full ${analysis.accuracy >= 70 ? 'bg-green-500' :
                              analysis.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${analysis.accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs md:text-sm font-bold ${analysis.accuracy >= 70 ? 'text-green-600' :
                          analysis.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {analysis.accuracy.toFixed(1)}%
                        </p>
                        <p className="text-[10px] md:text-[11px] text-gray-500">
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
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#124874] rounded"></div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">Phân tích cá nhân</h3>
              <span className="text-xs md:text-sm text-gray-500">- {user?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1">Số bài đã làm</p>
                <p className="text-xl md:text-2xl font-bold text-[#124874]">{studentAnalysis.attemptCount}</p>
              </div>
              <div className="bg-green-50 p-2 md:p-3 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1">Điểm trung bình</p>
                <p className="text-xl md:text-2xl font-bold text-green-700">{studentAnalysis.avgScore}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2 text-xs md:text-sm">
                Kiến thức cần cải thiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {studentAnalysis.knowledgeAnalysis.slice(0, 5).map((analysis, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-2 md:p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2">
                        {analysis.topic}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500">
                        {analysis.chapter}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 md:gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                          <div
                            className={`h-1.5 md:h-2 rounded-full ${analysis.accuracy >= 70 ? 'bg-green-500' :
                              analysis.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${analysis.accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs md:text-sm font-bold ${analysis.accuracy >= 70 ? 'text-green-600' :
                          analysis.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {analysis.accuracy.toFixed(1)}%
                        </p>
                        <p className="text-[10px] md:text-[11px] text-gray-500">
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
                <div className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{overallFeedback.overallFeedback}</ReactMarkdown>
                </div>

                {(overallFeedback.strengths.length > 0 || overallFeedback.weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-green-700 mb-2 text-sm">Điểm mạnh chính</h5>
                      {overallFeedback.strengths.length === 0 ? (
                        <p className="text-gray-500 text-xs">Chưa có thông tin cụ thể.</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                          {overallFeedback.strengths.slice(0, 4).map((item, index) => (
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
                      <h5 className="font-semibold text-red-700 mb-2 text-sm">Điểm cần cải thiện</h5>
                      {overallFeedback.weaknesses.length === 0 ? (
                        <p className="text-gray-500 text-xs">Chưa có thông tin cụ thể.</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                          {overallFeedback.weaknesses.slice(0, 4).map((item, index) => (
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
                )}

                {overallFeedback.suggestedTopics.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-[#124874] mb-1 text-sm">Chủ đề nên ưu tiên ôn</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                      {overallFeedback.suggestedTopics.slice(0, 5).map((item, index) => (
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
                  </div>
                )}

                {overallFeedback.suggestedNextActions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-[#124874] mb-1 text-sm">Hành động gợi ý tiếp theo</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                      {overallFeedback.suggestedNextActions.slice(0, 5).map((item, index) => (
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
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {studentAnalysis && (
          <div className="border-t border-gray-200 my-6"></div>
        )}

        {/* Progress Tracking Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-[#124874] rounded"></div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Theo dõi tiến triển theo chương</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Chọn chương để theo dõi
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(e.target.value);
                  setProgressFeedback(null);
                  setProgressError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-xs md:text-sm"
              >
                <option value="">Chọn chương</option>
                {availableChapters.map(chapter => (
                  <option key={chapter} value={chapter}>{chapter}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={async () => {
                  if (!progressData || !user) return;

                  try {
                    setProgressLoading(true);
                    setProgressError(null);
                    setProgressFeedback(null);

                    const result = await analyzeProgress({
                      studentName: user.name,
                      chapter: selectedChapter,
                      progressData: progressData.dataPoints,
                      avgScore: progressData.avgScore,
                      trend: progressData.trend
                    });

                    setProgressFeedback(result);
                  } catch (error) {
                    console.error('Error analyzing progress:', error);
                    setProgressError('Không thể phân tích tiến triển. Vui lòng thử lại sau.');
                  } finally {
                    setProgressLoading(false);
                  }
                }}
                disabled={!progressData || progressLoading}
                className="w-full px-4 py-2 bg-[#124874] text-white text-xs md:text-sm font-medium rounded-lg hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {progressLoading ? 'Đang phân tích...' : 'Phân tích tiến triển với AI'}
              </button>
            </div>
          </div>

          {progressData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                  <p className="text-[10px] md:text-xs text-gray-600 mb-1">Số bài đã làm</p>
                  <p className="text-lg md:text-2xl font-bold text-[#124874]">{progressData.attemptCount}</p>
                </div>
                <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                  <p className="text-[10px] md:text-xs text-gray-600 mb-1">Điểm TB</p>
                  <p className="text-lg md:text-2xl font-bold text-[#124874]">{progressData.avgScore.toFixed(1)}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg ${progressData.trend === 'improving' ? 'bg-green-50' :
                  progressData.trend === 'declining' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                  <p className="text-[10px] md:text-xs text-gray-600 mb-1">Xu hướng</p>
                  <div className={`flex items-center gap-1 md:gap-2 text-sm md:text-lg font-bold ${progressData.trend === 'improving' ? 'text-green-700' :
                    progressData.trend === 'declining' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                    {progressData.trend === 'improving' && <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />}
                    {progressData.trend === 'declining' && <TrendingDown className="w-4 h-4 md:w-6 md:h-6" />}
                    {progressData.trend === 'stable' && <Minus className="w-4 h-4 md:w-6 md:h-6" />}
                    <span className="hidden sm:inline">{progressData.trend === 'improving' ? 'Tiến bộ' :
                      progressData.trend === 'declining' ? 'Giảm' : 'Ổn định'}</span>
                  </div>
                </div>
              </div>

              {/* Progress history */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-xs md:text-sm">Lịch sử điểm theo thời gian</h4>
                <div className="space-y-2">
                  {progressData.dataPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                      <span className="text-gray-500 w-20 md:w-24 flex-shrink-0">{point.date}</span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                          <div
                            className={`h-1.5 md:h-2 rounded-full ${point.score >= 80 ? 'bg-green-500' :
                              point.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${point.score}%` }}
                          />
                        </div>
                      </div>
                      <span className={`font-medium w-10 md:w-12 text-right ${point.score >= 80 ? 'text-green-600' :
                        point.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {point.score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {progressLoading && (
            <div className="mt-4 text-sm text-gray-500">
              Đang phân tích tiến triển bằng AI...
            </div>
          )}

          {progressError && (
            <div className="mt-4 text-sm text-red-600">
              {progressError}
            </div>
          )}

          {progressFeedback && !progressLoading && !progressError && (
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-3 text-sm">
              <h4 className="font-semibold text-[#124874]">Nhận xét tiến triển từ AI</h4>
              <div className="text-gray-700 prose prose-sm max-w-none">
                <ReactMarkdown>{progressFeedback.overallFeedback}</ReactMarkdown>
              </div>

              {(progressFeedback.strengths.length > 0 || progressFeedback.weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-green-700 mb-2 text-sm">Điểm mạnh</h5>
                    {progressFeedback.strengths.length === 0 ? (
                      <p className="text-gray-500 text-xs">Chưa có thông tin cụ thể.</p>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                        {progressFeedback.strengths.slice(0, 4).map((item, index) => (
                          <li key={index} className="prose prose-sm max-w-none">
                            <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                              {item}
                            </ReactMarkdown>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h5 className="font-semibold text-red-700 mb-2 text-sm">Điểm cần cải thiện</h5>
                    {progressFeedback.weaknesses.length === 0 ? (
                      <p className="text-gray-500 text-xs">Chưa có thông tin cụ thể.</p>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                        {progressFeedback.weaknesses.slice(0, 4).map((item, index) => (
                          <li key={index} className="prose prose-sm max-w-none">
                            <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                              {item}
                            </ReactMarkdown>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {progressFeedback.suggestedNextActions.length > 0 && (
                <div>
                  <h5 className="font-semibold text-[#124874] mb-1 text-sm">Hành động gợi ý tiếp theo</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
                    {progressFeedback.suggestedNextActions.slice(0, 5).map((item, index) => (
                      <li key={index} className="prose prose-sm max-w-none">
                        <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                          {item}
                        </ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!selectedChapter && (
            <div className="text-center py-6 text-gray-500 text-sm">
              Chọn một chương để xem tiến triển học tập
            </div>
          )}

          {selectedChapter && !progressData && (
            <div className="text-center py-6 text-gray-500 text-sm">
              Bạn chưa làm bài kiểm tra nào cho chương này
            </div>
          )}
        </div>

        {!quizAnalysis && !studentAnalysis && availableChapters.length === 0 && (
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
