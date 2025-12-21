import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getQuizDiscussions, removeQuizFromDiscussion } from '../services/api';
import { QuizDiscussion as QuizDiscussionType } from '../types';
import { MessageSquare, Trash2, Users, Clock, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuizDiscussionProps {
    onOpenChat: (quizId: string, quizTitle: string) => void;
}

const PAGE_SIZE = 5;

export default function QuizDiscussion({ onOpenChat }: QuizDiscussionProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [discussions, setDiscussions] = useState<QuizDiscussionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadDiscussions = async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const data = await getQuizDiscussions(pageNum, PAGE_SIZE);
            setDiscussions(data.items);
            setTotalPages(data.pages);
            setTotal(data.total);
            setPage(pageNum);
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'Không thể tải danh sách thảo luận',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDiscussions(1);
    }, []);

    const handleRemove = async (quizId: string, quizTitle: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa thảo luận về "${quizTitle}"?`)) {
            return;
        }

        try {
            await removeQuizFromDiscussion(quizId);
            showToast('Đã xóa thảo luận thành công!', 'success');
            // If we deleted the last item on the current page and it's not the first page, go back
            if (discussions.length === 1 && page > 1) {
                loadDiscussions(page - 1);
            } else {
                loadDiscussions(page);
            }
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa thảo luận',
                'error'
            );
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            loadDiscussions(newPage);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-2">
                <h2 className="block-title__title">THẢO LUẬN ĐỀ THI</h2>
            </div>

            <div className="bg-white rounded-xl shadow-md p-3 md:p-5">
                {loading ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Đang tải danh sách thảo luận...
                    </div>
                ) : discussions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Chưa có đề thi nào được đưa vào thảo luận</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Bạn có thể thêm đề thi vào thảo luận từ trang Danh sách đề
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {discussions.map((disc) => (
                                <div
                                    key={disc.id}
                                    className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#124874] mb-1 break-words text-sm md:text-base">
                                                {disc.quizTitle}
                                            </h3>
                                            {disc.quizDescription && (
                                                <p className="text-xs md:text-sm text-gray-600 mb-2 break-words line-clamp-2">
                                                    {disc.quizDescription}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>Thêm bởi: {disc.addedByName}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatDate(disc.addedAt)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#124874] rounded">
                                                    <MessageCircle className="w-3 h-3" />
                                                    <span>{disc.messageCount} tin nhắn</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => onOpenChat(disc.quizId, disc.quizTitle)}
                                                className="px-3 md:px-4 py-1.5 rounded-lg bg-[#124874] text-white hover:bg-[#0d3351] transition-colors text-sm flex items-center gap-1"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="hidden sm:inline">Tham gia</span>
                                            </button>

                                            {(disc.addedBy === user?.id || user?.role === 'admin') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(disc.quizId, disc.quizTitle)}
                                                    className="px-2 md:px-3 py-1.5 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Xóa khỏi thảo luận"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4">
                                <p className="text-xs md:text-sm text-gray-500">
                                    Hiển thị {discussions.length} thảo luận (Trang {page}/{totalPages}) - Tổng: {total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                        className="flex items-center gap-1 px-2 md:px-3 py-1.5 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Trước</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= page - 1 && pageNum <= page + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`min-w-[32px] md:min-w-[38px] px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-all duration-200 ${page === pageNum
                                                                ? 'bg-[#124874] text-white shadow-md'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === page - 2 ||
                                                pageNum === page + 2
                                            ) {
                                                return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
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
