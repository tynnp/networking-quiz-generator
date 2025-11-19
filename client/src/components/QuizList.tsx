import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Eye, PlayCircle, Trash2 } from 'lucide-react';

interface QuizListProps {
  onTakeQuiz: (quizId: string) => void;
  onPreviewQuiz: (quizId: string) => void;
}

export default function QuizList({ onTakeQuiz, onPreviewQuiz }: QuizListProps) {
  const { quizzes, deleteQuiz } = useData();
  const { user } = useAuth();

  const handleDeleteQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề "${quiz.title}"?`)) {
      return;
    }

    deleteQuiz(quizId);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">DANH SÁCH ĐỀ THI</h2>
      </div>
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="space-y-3">
          {quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có đề thi nào
            </div>
          ) : (
            quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#124874] mb-1">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-sm text-gray-600 mb-2">
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
                      {quiz.settings.difficulty && (
                        <div className={`px-2 py-0.5 rounded ${
                          quiz.settings.difficulty === 'easy'
                            ? 'bg-green-50 text-green-700'
                            : quiz.settings.difficulty === 'medium'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {quiz.settings.difficulty === 'easy' ? 'Dễ' :
                           quiz.settings.difficulty === 'medium' ? 'TB' : 'Khó'}
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
      </div>
    </div>
  );
}
