/*
 * Copyright 2025 Nguyễn Ngọc Phú Tỷ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Eye, PlayCircle, Trash2, Search, ChevronLeft, ChevronRight, MessageSquarePlus, Printer, X, FileText, FileCheck } from 'lucide-react';
import { addQuizToDiscussion } from '../services/api';
import { Quiz } from '../types';

interface QuizListProps {
  onTakeQuiz: (quizId: string) => void;
  onPreviewQuiz: (quizId: string) => void;
}

export default function QuizList({ onTakeQuiz, onPreviewQuiz }: QuizListProps) {
  const { quizzes, deleteQuiz, loading, pagination } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [printModalQuiz, setPrintModalQuiz] = useState<Quiz | null>(null);

  const filteredQuizzes = useMemo(() => {
    if (!searchQuery.trim()) return quizzes;
    const query = searchQuery.toLowerCase();
    return quizzes.filter((quiz) => {
      if (quiz.title.toLowerCase().includes(query)) return true;

      if (quiz.description && quiz.description.toLowerCase().includes(query)) return true;

      if (quiz.settings.chapter && quiz.settings.chapter.toLowerCase().includes(query)) return true;

      if (quiz.settings.difficulty) {
        const difficultyLabels: Record<string, string> = {
          'easy': 'dễ',
          'medium': 'trung bình',
          'hard': 'khó'
        };
        const label = difficultyLabels[quiz.settings.difficulty] || quiz.settings.difficulty;
        if (label.toLowerCase().includes(query)) return true;
      }
      return false;
    });
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

  const handleAddToDiscussion = async (quizId: string) => {
    try {
      await addQuizToDiscussion(quizId);
      showToast('Đã thêm đề thi vào thảo luận!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm đề vào thảo luận.',
        'error'
      );
    }
  };

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  const getDifficultyLabel = (difficulty: string | undefined) => {
    if (difficulty === 'easy') return 'Dễ';
    if (difficulty === 'medium') return 'Trung bình';
    if (difficulty === 'hard') return 'Khó';
    return 'Hỗn hợp';
  };

  const printQuiz = (quiz: Quiz, showAnswers: boolean) => {
    setPrintModalQuiz(null);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Không thể mở cửa sổ in. Vui lòng cho phép popup.', 'error');
      return;
    }

    const questionsHtml = quiz.questions.map((q, idx) => `
      <div class="question">
        <div class="question-header">
          <span class="question-number">Câu ${idx + 1}:</span>
          <span class="question-content">${q.content}</span>
        </div>
        <div class="options">
          ${q.options.map((opt, optIdx) => `
            <div class="option ${showAnswers && optIdx === q.correctAnswer ? 'correct' : ''}">
              <span class="option-label">${getOptionLabel(optIdx)}.</span>
              <span class="option-content">${opt}</span>
            </div>
          `).join('')}
        </div>
        ${showAnswers && q.explanation ? `
          <div class="explanation">
            <strong>Giải thích:</strong> ${q.explanation}
          </div>
        ` : ''}
      </div>
    `).join('');

    const answerKeyHtml = showAnswers ? `
      <div class="answer-key">
        <h3>ĐÁP ÁN</h3>
        <div class="answer-grid">
          ${quiz.questions.map((q, idx) => `
            <div class="answer-item">
              <span class="answer-number">Câu ${idx + 1}:</span>
              <span class="answer-value">${getOptionLabel(q.correctAnswer)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>${quiz.title}${showAnswers ? ' - Có đáp án' : ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            padding: 20mm;
            max-width: 210mm;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .header h1 {
            font-size: 16pt;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .header .subtitle {
            font-size: 11pt;
            color: #333;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 11pt;
          }
          .meta-item {
            padding: 4px 8px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .question {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .question-header {
            margin-bottom: 8px;
          }
          .question-number {
            font-weight: bold;
            margin-right: 8px;
          }
          .options {
            margin-left: 20px;
          }
          .option {
            margin: 4px 0;
            padding: 4px 8px;
          }
          .option.correct {
            background: #d4edda;
            border-left: 3px solid #28a745;
            font-weight: bold;
          }
          .option-label {
            font-weight: bold;
            margin-right: 8px;
          }
          .explanation {
            margin-top: 8px;
            margin-left: 20px;
            padding: 8px;
            background: #fff3cd;
            border-left: 3px solid #ffc107;
            font-size: 11pt;
            font-style: italic;
          }
          .answer-key {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #000;
            page-break-before: auto;
          }
          .answer-key h3 {
            text-align: center;
            margin-bottom: 15px;
            font-size: 14pt;
          }
          .answer-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
          }
          .answer-item {
            padding: 4px;
            text-align: center;
            border: 1px solid #ddd;
          }
          .answer-number {
            font-weight: bold;
          }
          .answer-value {
            color: #28a745;
            font-weight: bold;
          }
          @media print {
            body { padding: 10mm; }
            .question { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${quiz.title}</h1>
          ${quiz.description ? `<div class="subtitle">${quiz.description}</div>` : ''}
        </div>
        <div class="meta">
          <span class="meta-item">Số câu hỏi: ${quiz.questions.length}</span>
          <span class="meta-item">Thời gian: ${quiz.duration} phút</span>
          ${quiz.settings.chapter ? `<span class="meta-item">${quiz.settings.chapter}</span>` : ''}
          <span class="meta-item">Độ khó: ${getDifficultyLabel(quiz.settings.difficulty)}</span>
        </div>
        <div class="questions">
          ${questionsHtml}
        </div>
        ${answerKeyHtml}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">DANH SÁCH ĐỀ THI</h2>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
            maxLength={100}
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-xs md:text-sm text-gray-600">
            Tìm thấy {filteredQuizzes.length} đề thi
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-3 md:p-5">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Đang tải danh sách đề thi...
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'Không tìm thấy đề thi nào phù hợp' : 'Chưa có đề thi nào'}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filteredQuizzes.map(quiz => (
                    <div
                      key={quiz.id}
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#124874] mb-1 break-words text-sm md:text-base">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-xs md:text-sm text-gray-600 mb-2 break-words">
                              {quiz.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              {quiz.questions.length} câu hỏi
                            </div>
                            <div className="flex items-center gap-1">
                              {quiz.duration} phút
                            </div>
                            {quiz.settings.chapter && (
                              <div className="px-2 py-0.5 bg-blue-50 text-[#124874] rounded text-xs">
                                {quiz.settings.chapter}
                              </div>
                            )}
                            {quiz.settings.difficulty !== undefined && (
                              <div className={`px-2 py-0.5 rounded text-xs ${!quiz.settings.difficulty || quiz.settings.difficulty === ''
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

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => onPreviewQuiz(quiz.id)}
                            className="px-2 md:px-3 py-1.5 rounded-lg border border-[#124874] text-[#124874] hover:bg-blue-50 transition-colors"
                            title="Xem câu hỏi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Button */}
                          <button
                            type="button"
                            onClick={() => setPrintModalQuiz(quiz)}
                            className="px-2 md:px-3 py-1.5 rounded-lg border border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors"
                            title="In đề"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {user && (
                            <>
                              <button
                                type="button"
                                onClick={() => onTakeQuiz(quiz.id)}
                                className="px-2 md:px-3 py-1.5 rounded-lg bg-[#124874] text-white hover:bg-[#0d3351] transition-colors"
                                title="Làm bài"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddToDiscussion(quiz.id)}
                                className="px-2 md:px-3 py-1.5 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 transition-colors"
                                title="Thêm vào thảo luận"
                              >
                                <MessageSquarePlus className="w-4 h-4" />
                              </button>
                              {quiz.createdBy === user.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuiz(quiz.id)}
                                  className="px-2 md:px-3 py-1.5 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 transition-colors"
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
                  ))}
                </div>

                {/* Pagination Controls */}
                {!searchQuery && pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4">
                    <p className="text-xs md:text-sm text-gray-500">
                      Hiển thị {filteredQuizzes.length} đề thi (Trang {pagination.currentPage})
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => pagination.setPage(Math.max(1, pagination.currentPage - 1))}
                        disabled={pagination.currentPage === 1}
                        className="flex items-center gap-1 px-2 md:px-3 py-1.5 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Trước</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === pagination.totalPages ||
                            (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => pagination.setPage(page)}
                                className={`min-w-[32px] md:min-w-[38px] px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-all duration-200 ${pagination.currentPage === page
                                  ? 'bg-[#124874] text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === pagination.currentPage - 2 ||
                            page === pagination.currentPage + 2
                          ) {
                            return <span key={page} className="px-1 text-gray-400">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => pagination.setPage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                        disabled={pagination.currentPage === pagination.totalPages}
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
        )}
      </div>

      {/* Print Modal */}
      {printModalQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-500" />
                In đề thi
              </h3>
              <button
                onClick={() => setPrintModalQuiz(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <p className="text-sm text-gray-600 mb-2">
                Đề thi: <span className="font-semibold text-[#124874]">{printModalQuiz.title}</span>
              </p>
              <p className="text-xs md:text-sm text-gray-500 mb-6">
                Chọn chế độ in đề thi:
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => printQuiz(printModalQuiz, false)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Không có đáp án</p>
                    <p className="text-xs text-gray-500">In đề thi sạch để làm bài</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => printQuiz(printModalQuiz, true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-left"
                >
                  <FileCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Có đáp án</p>
                    <p className="text-xs text-gray-500">In đề kèm đáp án và giải thích</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPrintModalQuiz(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
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
