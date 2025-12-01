import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface AttemptDetailProps {
  attemptId: string;
  onBack: () => void;
}

export default function AttemptDetail({ attemptId, onBack }: AttemptDetailProps) {
  const { getAttemptById, loadAttemptById, getQuizById } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(getAttemptById(attemptId));

  useEffect(() => {
    const loadAttempt = async () => {
      const currentAttempt = getAttemptById(attemptId);
      if (!currentAttempt) {
        setLoading(true);
        const loadedAttempt = await loadAttemptById(attemptId);
        setAttempt(loadedAttempt);
        setLoading(false);
      } else {
        setAttempt(currentAttempt);
        setLoading(false);
      }
    };
    loadAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-center text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-center text-gray-500 mb-4">
            Không tìm thấy bài làm.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] text-sm"
            >
              Quay lại kết quả của tôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quiz = getQuizById(attempt.quizId);

  if (!quiz) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-center text-gray-500 mb-4">
            Không tìm thấy đề thi của bài làm này.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] text-sm"
            >
              Quay lại kết quả của tôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(attempt.answers).length;
  const correctCount = quiz.questions.reduce((count, question) => {
    const userAnswer = attempt.answers[question.id];
    return userAnswer === question.correctAnswer ? count + 1 : count;
  }, 0);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="block-title__title">CHI TIẾT BÀI LÀM</h2>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] text-sm"
        >
          Quay lại kết quả của tôi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#124874] mb-1">{quiz.title}</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                Người làm: {user?.name}
              </p>
              <p>
                Thời gian làm: {formatDate(attempt.completedAt)}
              </p>
              <p>
                Thời lượng: {formatTime(attempt.timeSpent)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-3xl font-bold ${
              attempt.score >= 80 ? 'text-green-600' :
              attempt.score >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {attempt.score.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500">điểm</p>
            <p className="mt-1 text-xs text-gray-600">
              Đúng {correctCount}/{totalQuestions} câu, đã trả lời {answeredCount}/{totalQuestions} câu
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((question, index) => {
          const userAnswerIndex = attempt.answers[question.id];
          const isAnswered = userAnswerIndex !== undefined;
          const isCorrect = isAnswered && userAnswerIndex === question.correctAnswer;

          return (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    <span className="mr-1">Câu {index + 1}.</span>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{question.content}</ReactMarkdown>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {question.chapter.startsWith('Chương') ? question.chapter : `Chương: ${question.chapter}`} • Chủ đề: {question.topic} • Mức độ: {question.difficulty === 'easy' ? 'Dễ' : question.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </p>
                </div>

                <div className="text-right text-xs font-semibold">
                  {isAnswered ? (
                    isCorrect ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700">
                        ĐÚNG
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700">
                        SAI
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      CHƯA TRẢ LỜI
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {question.options.map((option, optionIndex) => {
                  const isUserChoice = userAnswerIndex === optionIndex;
                  const isCorrectAnswer = question.correctAnswer === optionIndex;

                  let borderClass = 'border-gray-200';
                  let bgClass = 'bg-white hover:bg-gray-50';
                  let textClass = 'text-gray-700';

                  if (isCorrectAnswer) {
                    borderClass = 'border-green-500';
                    bgClass = 'bg-green-50';
                  }

                  if (isUserChoice && !isCorrectAnswer) {
                    borderClass = 'border-red-500';
                    bgClass = 'bg-red-50';
                  }

                  return (
                    <div
                      key={optionIndex}
                      className={`w-full px-4 py-2 rounded-lg border text-sm ${borderClass} ${bgClass} ${textClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-500 text-white'
                            : isUserChoice
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-300 text-gray-500'
                        }`}>
                          {String.fromCharCode(65 + optionIndex)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-3 mt-2 text-xs">
                <p className="font-semibold text-gray-700 mb-1">Đáp án đúng:</p>
                <p className="mb-2 text-gray-700">
                  {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                </p>
                <p className="font-semibold text-gray-700 mb-1">Giải thích:</p>
                <div className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{question.explanation || 'Chưa có giải thích cho câu hỏi này.'}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
