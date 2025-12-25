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

import { X, Key, Settings as SettingsIcon, ExternalLink } from 'lucide-react';

interface DefaultKeyLockedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToSettings: () => void;
}

export default function DefaultKeyLockedModal({ isOpen, onClose, onGoToSettings }: DefaultKeyLockedModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Key className="w-5 h-5 text-orange-500" />
                        Yêu cầu API Key cá nhân
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6">
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                            <strong>Quản trị viên đã tắt API Key mặc định của hệ thống.</strong>
                        </p>
                        <p className="text-sm text-orange-700 mt-2">
                            Để sử dụng các tính năng AI (tạo câu hỏi, phân tích kết quả), bạn cần thiết lập API Key Gemini cá nhân.
                        </p>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700">
                            <strong>Lấy API Key miễn phí tại:</strong>{' '}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                                Google AI Studio <ExternalLink className="w-3 h-3" />
                            </a>
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Để sau
                        </button>
                        <button
                            type="button"
                            onClick={onGoToSettings}
                            className="px-4 py-2 bg-[#124874] text-white rounded-lg text-sm hover:bg-[#0d3351] flex items-center gap-2"
                        >
                            <SettingsIcon className="w-4 h-4" />
                            Đi đến Cài đặt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
