import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Pencil, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizPreviewProps {
  quizId: string;
  onBack: () => void;
}

export default function QuizPreview({ quizId, onBack }: QuizPreviewProps) {
  const { getQuizById, updateQuestion, deleteQuestion, refreshQuizzes } = useData();
  const { showToast } = useToast();
  const quiz = getQuizById(quizId);
  const [showAnswers, setShowAnswers] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingOptions, setEditingOptions] = useState<string[]>([]);
  const [editingCorrectAnswer, setEditingCorrectAnswer] = useState(0);
  const [editingExplanation, setEditingExplanation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const startEditQuestion = (questionId: string) => {
    if (!quiz) return;
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;
    setEditingQuestionId(questionId);
    setEditingContent(question.content);
    setEditingOptions(question.options);
    setEditingCorrectAnswer(question.correctAnswer);
    setEditingExplanation(question.explanation ?? '');
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
  };

  const saveQuestion = async (questionId: string) => {
    if (!quiz || !editingQuestionId) return;

    setIsSaving(true);
    try {
      await updateQuestion(quiz.id, questionId, {
        content: editingContent,
        options: editingOptions,
        correctAnswer: editingCorrectAnswer,
        explanation: editingExplanation
      });
      await refreshQuizzes();
      setEditingQuestionId(null);
      showToast('Lưu câu hỏi thành công!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu câu hỏi.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!quiz) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi?')) {
      return;
    }

    setIsDeleting(questionId);
    try {
      await deleteQuestion(quiz.id, questionId);
      await refreshQuizzes();
      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
      }
      showToast('Xóa câu hỏi thành công!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa câu hỏi.',
        'error'
      );
    } finally {
      setIsDeleting(null);
    }
  };

  if (!quiz) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-center text-gray-500 text-sm">Không tìm thấy đề thi.</p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getDifficultyLabel = (difficulty: string | undefined) => {
    if (difficulty === 'easy') return 'Dễ';
    if (difficulty === 'medium') return 'Trung bình';
    if (difficulty === 'hard') return 'Khó';
    return difficulty || '';
  };

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">XEM CÂU HỎI ĐỀ THI</h2>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="mb-4 border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-lg font-bold text-[#124874] break-words">{quiz.title}</h3>
            <button
              type="button"
              onClick={() => setShowAnswers(prev => !prev)}
              className="px-4 py-1.5 bg-[#124874] text-white rounded-lg text-xs hover:bg-[#0d3351]"
            >
              {showAnswers ? 'Ẩn đáp án' : 'Xem đáp án'}
            </button>
          </div>
          {quiz.description && (
            <p className="text-sm text-gray-600 mb-2 break-words">{quiz.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>{quiz.questions.length} câu hỏi</span>
            <span>{quiz.duration} phút làm bài</span>
            {quiz.settings.chapter && (
              <span>{quiz.settings.chapter.startsWith('Chương') ? quiz.settings.chapter : `Chương: ${quiz.settings.chapter}`}</span>
            )}
            {quiz.settings.difficulty && (
              <span>Độ khó: {getDifficultyLabel(quiz.settings.difficulty)}</span>
            )}
          </div>
        </div>

        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {quiz.questions.map((question, index) => {
            const isEditing = editingQuestionId === question.id;

            return (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="w-6 h-6 rounded-full bg-[#124874] text-white text-xs flex items-center justify-center mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="text-sm font-medium text-gray-800 w-full border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#124874] resize-y"
                          rows={2}
                          maxLength={500}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-800 prose prose-sm max-w-none">
                          <ReactMarkdown>{question.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEditQuestion(question.id)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                        title="Sửa câu hỏi"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={isDeleting === question.id}
                      className="px-3 py-1.5 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 ml-1">
                    <div className="space-y-2">
                      {editingOptions.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <span className="font-semibold w-5">
                            {getOptionLabel(optIndex)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              setEditingOptions(prev =>
                                prev.map((opt, i) => (i === optIndex ? e.target.value : opt))
                              )
                            }
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#124874]"
                            maxLength={150}
                          />
                          <label className="flex items-center gap-1 text-[11px] text-gray-600">
                            <input
                              type="radio"
                              checked={editingCorrectAnswer === optIndex}
                              onChange={() => setEditingCorrectAnswer(optIndex)}
                            />
                            Đúng
                          </label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Giải thích
                      </label>
                      <textarea
                        value={editingExplanation}
                        onChange={(e) => setEditingExplanation(e.target.value)}
                        className="w-full text-xs text-gray-700 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#124874] resize-y"
                        rows={2}
                        placeholder="Giải thích vì sao đáp án đúng"
                        maxLength={600}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 ml-1">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="font-semibold w-5">
                            {getOptionLabel(optIndex)}.
                          </span>
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>

                    {showAnswers && (
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="text-green-700">
                          Đáp án đúng: {getOptionLabel(question.correctAnswer)}
                        </p>
                        {question.explanation && (
                          <div className="text-gray-700">
                            <p className="font-semibold mb-1">Giải thích:</p>
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{question.explanation}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
                  <span>{question.chapter.startsWith('Chương') ? question.chapter : `Chương: ${question.chapter}`}</span>
                  <span>Chủ đề: {question.topic}</span>
                </div>

                {isEditing && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditQuestion}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => saveQuestion(question.id)}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-lg bg-[#124874] text-white hover:bg-[#0d3351] disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      {isSaving ? 'Đang lưu...' : 'Lưu câu hỏi'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    </div>
  );
}
