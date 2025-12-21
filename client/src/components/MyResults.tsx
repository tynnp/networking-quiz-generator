import { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface MyResultsProps {
  onViewAttemptDetail?: (attemptId: string) => void;
}

export default function MyResults({ onViewAttemptDetail }: MyResultsProps) {
  const { attempts, quizzes, attemptsLoading, refreshAttempts } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    refreshAttempts();
  }, []);

  const myAttempts = useMemo(() => {
    const userAttempts = attempts.filter(a => a.studentId === user?.id);
    if (!searchQuery.trim()) return userAttempts;

    const query = searchQuery.toLowerCase();
    return userAttempts.filter(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      return quiz && quiz.title.toLowerCase().includes(query);
    });
  }, [attempts, user?.id, searchQuery, quizzes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(myAttempts.length / ITEMS_PER_PAGE);
  const paginatedAttempts = useMemo(() => {
    return myAttempts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [myAttempts, currentPage]);

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

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên đề thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874]"
            maxLength={100}
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Tìm thấy {myAttempts.length} kết quả
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        {attemptsLoading ? (
          <div className="text-center py-8 text-gray-500">
            Đang tải kết quả...
          </div>
        ) : myAttempts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Không tìm thấy kết quả nào phù hợp' : 'Bạn chưa làm bài thi nào'}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedAttempts.map(attempt => {
                const quiz = quizzes.find(q => q.id === attempt.quizId);
                if (!quiz) return null;

                return (
                  <div
                    key={attempt.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#124874] mb-1 break-words">
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
                        <div className={`text-3xl font-bold ${attempt.score >= 80 ? 'text-green-600' :
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
                          className={`h-2 rounded-full ${attempt.score >= 80 ? 'bg-green-500' :
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4">
                <p className="text-xs md:text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, myAttempts.length)} trong tổng số {myAttempts.length} kết quả
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-2 md:px-3 py-1.5 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] md:min-w-[38px] px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-all duration-200 ${currentPage === page
                              ? 'bg-[#124874] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-1 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-2 md:px-3 py-1.5 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
