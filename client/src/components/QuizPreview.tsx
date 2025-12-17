import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Pencil, Trash2, X, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizPreviewProps {
  quizId: string;
  onBack: () => void;
}

export default function QuizPreview({ quizId, onBack }: QuizPreviewProps) {
  const { getQuizById, updateQuestion, deleteQuestion, refreshQuizzes, updateQuiz } = useData();
  const { showToast } = useToast();
  const { user } = useAuth();
  const quiz = getQuizById(quizId);
  const [showAnswers, setShowAnswers] = useState(false);

  // Quiz Edit State
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);

  // Question Edit State
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

  const handleEditQuizClick = () => {
    if (!quiz) return;
    setEditForm({
      title: quiz.title,
      description: quiz.description || ''
    });
    setIsEditingQuiz(true);
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    if (!editForm.title.trim()) {
      showToast('Tiêu đề không được để trống', 'error');
      return;
    }

    try {
      setIsUpdatingQuiz(true);
      await updateQuiz(quiz.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim()
      });
      await refreshQuizzes();
      showToast('Cập nhật đề thi thành công!', 'success');
      setIsEditingQuiz(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật đề thi.',
        'error'
      );
    } finally {
      setIsUpdatingQuiz(false);
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
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-lg font-bold text-[#124874] break-words">{quiz.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAnswers(prev => !prev)}
                className="px-4 py-1.5 bg-[#124874] text-white rounded-lg text-xs hover:bg-[#0d3351]"
              >
                {showAnswers ? 'Ẩn đáp án' : 'Xem đáp án'}
              </button>
              {user && quiz.createdBy === user.id && (
                <button
                  type="button"
                  onClick={handleEditQuizClick}
                  className="px-3 py-1.5 rounded-lg border border-yellow-400 text-yellow-600 hover:bg-yellow-50 text-xs flex items-center gap-1"
                  title="Sửa thông tin đề thi"
                >
                  <Pencil className="w-3 h-3" />
                  Sửa đề
                </button>
              )}
            </div>
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
      {/* Edit Quiz Modal */}
      {isEditingQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsEditingQuiz(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Chỉnh sửa thông tin đề thi
                    </h3>
                    <form onSubmit={handleUpdateQuiz} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Tiêu đề
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#124874] focus:border-[#124874] sm:text-sm"
                          placeholder="Nhập tiêu đề đề thi"
                          required
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Mô tả
                        </label>
                        <textarea
                          id="description"
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#124874] focus:border-[#124874] sm:text-sm"
                          placeholder="Nhập mô tả đề thi (tùy chọn)"
                          maxLength={500}
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdateQuiz}
                  disabled={isUpdatingQuiz}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#124874] text-base font-medium text-white hover:bg-[#0d3351] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#124874] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isUpdatingQuiz ? (
                    'Đang lưu...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingQuiz(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#124874] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
