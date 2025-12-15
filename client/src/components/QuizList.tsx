import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Eye, PlayCircle, Trash2, Search } from 'lucide-react';

interface QuizListProps {
  onTakeQuiz: (quizId: string) => void;
  onPreviewQuiz: (quizId: string) => void;
}

export default function QuizList({ onTakeQuiz, onPreviewQuiz }: QuizListProps) {
  const { quizzes, deleteQuiz, loading } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuizzes = useMemo(() => {
    if (!searchQuery.trim()) return quizzes;
    const query = searchQuery.toLowerCase();
    return quizzes.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(query) ||
        (quiz.description && quiz.description.toLowerCase().includes(query))
    );
  }, [quizzes, searchQuery]);

  const handleDeleteQuiz = async (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề "${quiz.title}"?`)) {
      return;
    }

    try {
      await deleteQuiz(quizId);
      showToast('Xóa đề thành công!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa đề.',
        'error'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2 flex justify-between items-center">
        <h2 className="block-title__title">DANH SÁCH ĐỀ THI</h2>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874]"
            maxLength={100}
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Tìm thấy {filteredQuizzes.length} đề thi
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Đang tải danh sách đề thi...
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'Không tìm thấy đề thi nào phù hợp' : 'Chưa có đề thi nào'}
              </div>
            ) : (
              filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#124874] mb-1 break-words">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 mb-2 break-words">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          {quiz.questions.length} câu hỏi
                        </div>
                        <div className="flex items-center gap-1">
                          {quiz.duration} phút
                        </div>
                        {quiz.settings.chapter && (
                          <div className="px-2 py-0.5 bg-blue-50 text-[#124874] rounded">
                            {quiz.settings.chapter}
                          </div>
                        )}
                        {quiz.settings.difficulty !== undefined && (
                          <div className={`px-2 py-0.5 rounded ${!quiz.settings.difficulty || quiz.settings.difficulty === ''
                            ? 'bg-gray-50 text-gray-700'
                            : quiz.settings.difficulty === 'easy'
                              ? 'bg-green-50 text-green-700'
                              : quiz.settings.difficulty === 'medium'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                            {!quiz.settings.difficulty || quiz.settings.difficulty === '' ? 'Hỗn hợp' :
                              quiz.settings.difficulty === 'easy' ? 'Dễ' :
                                quiz.settings.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPreviewQuiz(quiz.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#124874] text-[#124874] hover:bg-blue-50 transition-colors"
                        title="Xem câu hỏi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {user && (
                        <>
                          <button
                            type="button"
                            onClick={() => onTakeQuiz(quiz.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#124874] text-white hover:bg-[#0d3351] transition-colors"
                            title="Làm bài"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          {quiz.createdBy === user.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 transition-colors"
                              title="Xóa đề"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
