import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Search } from 'lucide-react';

interface MyResultsProps {
  onViewAttemptDetail?: (attemptId: string) => void;
}

export default function MyResults({ onViewAttemptDetail }: MyResultsProps) {
  const { attempts, quizzes, attemptsLoading, refreshAttempts } = useData();
  const { user } = useAuth();

  // NEW: search state
  const [search, setSearch] = useState('');

  useEffect(() => {
    refreshAttempts();
  }, []);

  // Filter attempts → only current user
  const myAttempts = attempts.filter(a => a.studentId === user?.id);

  // NEW: Filter by quiz title
  const filteredAttempts = myAttempts.filter(attempt => {
    const quiz = quizzes.find(q => q.id === attempt.quizId);
    return quiz?.title.toLowerCase().includes(search.toLowerCase());
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">KẾT QUẢ CỦA TÔI</h2>
      </div>

      {/* 🔍 NEW: Search bar */}
      <div className="mb-4 flex items-center gap-2 bg-white p-3 rounded-xl shadow">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm theo tên đề thi..."
          className="flex-1 outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        {attemptsLoading ? (
          <div className="text-center py-8 text-gray-500">
            Đang tải kết quả...
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy kết quả phù hợp
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAttempts.map(attempt => {
              const quiz = quizzes.find(q => q.id === attempt.quizId);
              if (!quiz) return null;

              return (
                <div
                  key={attempt.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#124874] mb-1">
                        {quiz.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          {formatDate(attempt.completedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          {formatTime(attempt.timeSpent)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className={`text-3xl font-bold ${
                        attempt.score >= 80 ? 'text-green-600' :
                        attempt.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {attempt.score.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-500">điểm</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Kết quả</span>
                      <span>
                        {Object.keys(attempt.answers).length}/{quiz.questions.length} câu
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          attempt.score >= 80 ? 'bg-green-500' :
                          attempt.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${attempt.score}%` }}
                      />
                    </div>
                  </div>

                  {onViewAttemptDetail && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onViewAttemptDetail(attempt.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-[#124874] text-[#124874] hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem chi tiết bài làm</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
