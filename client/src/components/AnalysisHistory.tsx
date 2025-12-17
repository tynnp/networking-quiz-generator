import { useState, useEffect } from 'react';
import { AnalysisHistory as AnalysisHistoryType, PaginatedResponse } from '../types';
import { getAnalysisHistory, deleteAnalysisHistoryItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ReactMarkdown from 'react-markdown';
import { Trash2, ChevronLeft, ChevronRight, Clock, FileText, TrendingUp, BarChart3 } from 'lucide-react';

export default function AnalysisHistory() {
    const { showToast } = useToast();
    const [history, setHistory] = useState<AnalysisHistoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedItem, setSelectedItem] = useState<AnalysisHistoryType | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const loadHistory = async (pageNum: number) => {
        try {
            setLoading(true);
            const response: PaginatedResponse<AnalysisHistoryType> = await getAnalysisHistory(pageNum, 10);
            setHistory(response.items);
            setTotalPages(response.pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error loading analysis history:', error);
            showToast('Không thể tải lịch sử phân tích', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory(1);
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Bạn có chắc chắn muốn xóa bản ghi phân tích này?')) return;

        try {
            setDeleting(id);
            await deleteAnalysisHistoryItem(id);
            showToast('Đã xóa bản ghi phân tích', 'success');

            // Reload current page
            if (history.length === 1 && page > 1) {
                loadHistory(page - 1);
            } else {
                loadHistory(page);
            }

            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
        } catch (error) {
            console.error('Error deleting analysis:', error);
            showToast('Không thể xóa bản ghi phân tích', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const getAnalysisTypeLabel = (type: string) => {
        switch (type) {
            case 'result': return 'Phân tích kết quả';
            case 'overall': return 'Phân tích tổng quan';
            case 'progress': return 'Phân tích tiến triển';
            default: return type;
        }
    };

    const getAnalysisTypeIcon = (type: string) => {
        switch (type) {
            case 'result': return <FileText className="w-4 h-4" />;
            case 'overall': return <BarChart3 className="w-4 h-4" />;
            case 'progress': return <TrendingUp className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getAnalysisTypeColor = (type: string) => {
        switch (type) {
            case 'result': return 'bg-blue-100 text-blue-700';
            case 'overall': return 'bg-purple-100 text-purple-700';
            case 'progress': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading && history.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Đang tải lịch sử phân tích...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-2">
                <h2 className="block-title__title">LỊCH SỬ PHÂN TÍCH AI</h2>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">

                {history.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">Chưa có phân tích nào được lưu</p>
                        <p className="text-sm mt-2">Các phân tích AI sẽ tự động được lưu khi bạn thực hiện</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* List */}
                        <div className="lg:w-1/2 space-y-3">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedItem?.id === item.id
                                        ? 'border-[#124874] bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getAnalysisTypeColor(item.analysisType)}`}>
                                                    {getAnalysisTypeIcon(item.analysisType)}
                                                    {getAnalysisTypeLabel(item.analysisType)}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(item.createdAt)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            disabled={deleting === item.id}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => loadHistory(page - 1)}
                                        disabled={page === 1 || loading}
                                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Trang {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => loadHistory(page + 1)}
                                        disabled={page === totalPages || loading}
                                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Detail */}
                        <div className="lg:w-1/2">
                            {selectedItem ? (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getAnalysisTypeColor(selectedItem.analysisType)}`}>
                                            {getAnalysisTypeIcon(selectedItem.analysisType)}
                                            {getAnalysisTypeLabel(selectedItem.analysisType)}
                                        </span>
                                        <span className="text-sm text-gray-500">{formatDate(selectedItem.createdAt)}</span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedItem.title}</h2>

                                    <div className="space-y-4">
                                        {/* Overall Feedback */}
                                        <div className="bg-white rounded-lg p-3 border">
                                            <h4 className="font-medium text-[#124874] mb-2">Nhận xét tổng quan</h4>
                                            <div className="prose prose-sm max-w-none text-gray-700">
                                                <ReactMarkdown>{selectedItem.result.overallFeedback}</ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Strengths */}
                                        {selectedItem.result.strengths.length > 0 && (
                                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                <h4 className="font-medium text-green-700 mb-2">Điểm mạnh</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {selectedItem.result.strengths.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Weaknesses */}
                                        {selectedItem.result.weaknesses.length > 0 && (
                                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                                <h4 className="font-medium text-red-700 mb-2">Điểm cần cải thiện</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {selectedItem.result.weaknesses.map((w, i) => (
                                                        <li key={i}>{w}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Suggested Topics */}
                                        {selectedItem.result.suggestedTopics.length > 0 && (
                                            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                                <h4 className="font-medium text-yellow-700 mb-2">Chủ đề nên ôn luyện</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {selectedItem.result.suggestedTopics.map((t, i) => (
                                                        <li key={i}>{t}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Next Actions */}
                                        {selectedItem.result.suggestedNextActions.length > 0 && (
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                <h4 className="font-medium text-blue-700 mb-2">Hành động tiếp theo</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {selectedItem.result.suggestedNextActions.map((a, i) => (
                                                        <li key={i}>{a}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-8 bg-gray-50 text-center text-gray-500">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Chọn một bản ghi để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
