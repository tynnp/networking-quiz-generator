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

  const [search, setSearch] = useState('');
  const [filterMine, setFilterMine] = useState(false);

  const handleDeleteQuiz = async (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề "${quiz.title}"?`)) return;

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

  // Filter quizzes theo search + "Đề của tôi"
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      const matchesSearch =
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        (q.settings?.chapter || '').toLowerCase().includes(search.toLowerCase());
      const mine = !filterMine || q.createdBy === user?.id;
      return matchesSearch && mine;
    });
  }, [quizzes, search, filterMine, user?.id]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tiêu đề */}
      <div className="mb-2">
        <h2 className="block-title__title">DANH SÁCH ĐỀ THI</h2>
      </div>

      {/* 🔍 Khung tìm kiếm + checkbox cùng hàng */}
      <div className="mb-4 flex items-center gap-4 w-full">
        {/* Search input */}
        <div className="flex items-center flex-1 bg-white p-3 rounded-xl shadow">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề hoặc chương..."
            className="flex-1 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Checkbox "Đề của tôi" */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterMine}
            onChange={e => setFilterMine(e.target.checked)}
            className="checkbox"
          />
          <span className="text-sm font-medium text-gray-700">Đề của tôi</span>
        </label>
      </div>

      {/* Danh sách đề */}
      <div className="bg-white rounded-xl shadow-md p-5">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Đang tải danh sách đề thi...
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có đề thi nào
              </div>
            ) : (
              filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-[#124874] mb-1">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <div>{quiz.questions?.length || 0} câu hỏi</div>
                      <div>{quiz.duration || 0} phút</div>
                      {quiz.settings?.chapter && (
                        <div className="px-2 py-0.5 bg-blue-50 text-[#124874] rounded">
                          {quiz.settings.chapter}
                        </div>
                      )}
                      {quiz.settings?.difficulty !== undefined && (
                        <div
                          className={`px-2 py-0.5 rounded ${!quiz.settings.difficulty || quiz.settings.difficulty === ''
                            ? 'bg-gray-50 text-gray-700'
                            : quiz.settings.difficulty === 'easy'
                              ? 'bg-green-50 text-green-700'
                              : quiz.settings.difficulty === 'medium'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                        >
                          {!quiz.settings.difficulty || quiz.settings.difficulty === ''
                            ? 'Hỗn hợp'
                            : quiz.settings.difficulty === 'easy'
                              ? 'Dễ'
                              : quiz.settings.difficulty === 'medium'
                                ? 'Trung bình'
                                : 'Khó'}
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

                    <button
                      type="button"
                      onClick={() => onTakeQuiz(quiz.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#124874] text-white hover:bg-[#0d3351] transition-colors"
                      title="Làm bài"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>

                    {quiz.createdBy === user?.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="px-3 py-1.5 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa đề"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
