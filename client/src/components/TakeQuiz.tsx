import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { QuizAttempt } from '../types';
import { createAttempt } from '../services/api';
import ReactMarkdown from 'react-markdown';

interface TakeQuizProps {
  quizId: string;
  onComplete: (attemptId: string) => void;
}

export default function TakeQuiz({ quizId, onComplete }: TakeQuizProps) {
  const { getQuizById, addAttempt } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const quiz = getQuizById(quizId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(quiz ? quiz.duration * 60 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!quiz) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-center text-gray-500">Không tìm thấy đề thi</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let correctCount = 0;
      quiz.questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          correctCount++;
        }
      });

      const score = (correctCount / quiz.questions.length) * 100;
      const timeSpent = (quiz.duration * 60) - timeLeft;

      // Save attempt to server
      const createdAttempt = await createAttempt({
        quizId: quiz.id,
        answers,
        score,
        timeSpent
      });

      // Also add to local state for immediate UI update
      addAttempt(createdAttempt);
      showToast('Nộp bài thành công!', 'success');
      onComplete(createdAttempt.id);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      showToast('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[#124874] break-words">{quiz.title}</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-[#124874]'
              }`}>
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#124874] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Câu {currentQuestionIndex + 1} / {quiz.questions.length}
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-3 prose prose-sm max-w-none">
              <ReactMarkdown>{currentQuestion.content}</ReactMarkdown>
            </div>
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm ${answers[currentQuestion.id] === index
                      ? 'border-[#124874] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === index
                        ? 'border-[#124874] bg-[#124874]'
                        : 'border-gray-300'
                      }`}>
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Câu trước
          </button>

          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] text-sm"
            >
              Câu tiếp
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#CF373D] text-white rounded-lg hover:bg-[#b52f34] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              Nộp bài
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-medium text-gray-700 text-sm">Tổng quan câu hỏi</h3>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-[#124874]" />
              Hiện tại
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-400" />
              Đã trả lời
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300" />
              Chưa trả lời
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {quiz.questions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined;
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`h-9 min-w-[2.25rem] rounded text-xs font-medium flex items-center justify-center transition-colors ${isCurrent
                    ? 'bg-[#124874] text-white ring-2 ring-[#124874] ring-offset-2'
                    : isAnswered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
