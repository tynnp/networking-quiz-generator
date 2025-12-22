import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Settings as SettingsIcon, Eye, EyeOff, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle, Info, Key, Cpu, Shield, Lock, Unlock, Loader2 } from 'lucide-react';
import { getGeminiSettings, saveGeminiSettings, GeminiSettings, getSystemSettings, toggleDefaultKeyLock } from '../services/api';

const AVAILABLE_MODELS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Mới nhất)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
];

export default function Settings() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [savedSettings, setSavedSettings] = useState<GeminiSettings | null>(null);

    const [showApiKeyGuide, setShowApiKeyGuide] = useState(false);
    const [showErrorGuide, setShowErrorGuide] = useState(false);

    const [defaultKeyLocked, setDefaultKeyLocked] = useState(false);
    const [isTogglingLock, setIsTogglingLock] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getGeminiSettings();
                if (settings) {
                    setSelectedModel(settings.model || 'gemini-2.5-flash');
                    setApiKey(settings.apiKey || '');
                    setSavedSettings(settings);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            getSystemSettings().then(settings => {
                setDefaultKeyLocked(settings.defaultKeyLocked);
            }).catch(console.error);
        }
    }, [user]);

    useEffect(() => {
        if (savedSettings) {
            const modelChanged = selectedModel !== (savedSettings.model || 'gemini-2.5-flash');
            const apiKeyChanged = apiKey !== (savedSettings.apiKey || '');
            setHasChanges(modelChanged || apiKeyChanged);
        } else {
            setHasChanges(selectedModel !== 'gemini-2.5-flash' || apiKey !== '');
        }
    }, [selectedModel, apiKey, savedSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settings: GeminiSettings = {
                model: selectedModel,
                apiKey: apiKey,
            };
            await saveGeminiSettings(settings);
            setSavedSettings(settings);
            setHasChanges(false);
            showToast('Đã lưu cài đặt thành công!', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu cài đặt', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearApiKey = async () => {
        setApiKey('');
    };

    const handleToggleDefaultKeyLock = async () => {
        setIsTogglingLock(true);
        try {
            await toggleDefaultKeyLock(!defaultKeyLocked);
            setDefaultKeyLocked(!defaultKeyLocked);
            showToast(
                defaultKeyLocked ? 'Đã mở khóa API key mặc định' : 'Đã khóa API key mặc định',
                'success'
            );
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'Có lỗi xảy ra',
                'error'
            );
        } finally {
            setIsTogglingLock(false);
        }
    };

    if (!user) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                    <SettingsIcon className="w-16 h-16 mx-auto text-gray-300" />
                </div>
                <p className="text-lg font-medium mb-2">Vui lòng đăng nhập</p>
                <p className="text-sm">Đăng nhập để xem cài đặt cấu hình</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-2">
                    <h2 className="block-title__title">CÀI ĐẶT CẤU HÌNH</h2>
                </div>
                <div className="bg-white rounded-xl shadow-md p-5">
                    <div className="text-center py-8 text-gray-500">
                        Đang tải cài đặt...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-2">
                <h2 className="block-title__title">CÀI ĐẶT CẤU HÌNH</h2>
            </div>

            <div className="bg-white rounded-xl shadow-md p-3 md:p-5">
                <div className="space-y-6">

                    {/* Model Selection & API Key - Side by side on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Model Selection */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Cpu className="w-5 h-5 text-[#124874]" />
                                <h3 className="text-sm font-semibold text-gray-800">Chọn Model AI</h3>
                            </div>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#124874]"
                            >
                                {AVAILABLE_MODELS.map((model) => (
                                    <option key={model.value} value={model.value}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Model AI được sử dụng để tạo câu hỏi và phân tích kết quả.
                            </p>
                        </div>

                        {/* API Key Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Key className="w-5 h-5 text-[#124874]" />
                                <h3 className="text-sm font-semibold text-gray-800">Gemini API Key (Tùy chọn)</h3>
                            </div>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#124874]"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="p-1.5 text-gray-500 hover:text-gray-700"
                                        title={showApiKey ? 'Ẩn API Key' : 'Hiện API Key'}
                                    >
                                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    {apiKey && (
                                        <button
                                            type="button"
                                            onClick={handleClearApiKey}
                                            className="p-1.5 text-red-500 hover:text-red-700 text-xs"
                                            title="Xóa API Key"
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Nhập API Key riêng để không dùng API mặc định.
                            </p>

                            {/* API Key Status */}
                            {savedSettings?.apiKey && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Đang sử dụng API Key của bạn</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="px-4 py-2 bg-[#124874] text-white rounded-lg text-sm hover:bg-[#0d3351] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                'Lưu cài đặt'
                            )}
                        </button>
                    </div>

                    {/* Admin Settings Section */}
                    {user?.role === 'admin' && (
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-5 h-5 text-purple-600" />
                                <h3 className="text-sm font-semibold text-gray-800">Cài đặt Quản trị viên</h3>
                            </div>
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-purple-900">Khóa API Key mặc định</p>
                                        <p className="text-xs text-purple-700 mt-1">
                                            Khi bật, người dùng phải tự thiết lập API Key cá nhân để sử dụng các tính năng AI.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleToggleDefaultKeyLock}
                                        disabled={isTogglingLock}
                                        className={`ml-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${defaultKeyLocked
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {isTogglingLock ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : defaultKeyLocked ? (
                                            <Lock className="w-4 h-4" />
                                        ) : (
                                            <Unlock className="w-4 h-4" />
                                        )}
                                        {defaultKeyLocked ? 'Đang khóa' : 'Đang mở'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Key Guide */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => setShowApiKeyGuide(!showApiKeyGuide)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Hướng dẫn lấy Gemini API Key</span>
                            </div>
                            {showApiKeyGuide ? (
                                <ChevronUp className="w-5 h-5 text-blue-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-blue-600" />
                            )}
                        </button>

                        {showApiKeyGuide && (
                            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                                    <li>
                                        Truy cập{' '}
                                        <a
                                            href="https://aistudio.google.com/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                        >
                                            Google AI Studio <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </li>
                                    <li>Đăng nhập bằng tài khoản Google của bạn</li>
                                    <li>Click vào nút <strong>"Create API Key"</strong> (Tạo API Key)</li>
                                    <li>Chọn project hoặc tạo project mới</li>
                                    <li>Sao chép API Key được tạo và dán vào ô bên trên</li>
                                </ol>

                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                        <div className="text-xs text-yellow-800">
                                            <strong>Lưu ý bảo mật:</strong> Không chia sẻ API Key của bạn với người khác.
                                            API Key được mã hóa khi lưu vào hệ thống.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Guide */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowErrorGuide(!showErrorGuide)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                <span className="text-sm font-medium text-orange-800">Xử lý lỗi thường gặp</span>
                            </div>
                            {showErrorGuide ? (
                                <ChevronUp className="w-5 h-5 text-orange-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-orange-600" />
                            )}
                        </button>

                        {showErrorGuide && (
                            <div className="mt-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="space-y-4 text-sm">
                                    {/* Error 429 */}
                                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-mono text-xs">429</span>
                                            <strong>Quá giới hạn API (Rate Limit)</strong>
                                        </div>
                                        <p className="text-gray-600 text-xs">
                                            Bạn đã gửi quá nhiều request trong thời gian ngắn.
                                            <strong> Giải pháp:</strong> Đợi 1-2 phút rồi thử lại, hoặc sử dụng API Key riêng
                                            để có giới hạn cao hơn.
                                        </p>
                                    </div>

                                    {/* Error 503 */}
                                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-mono text-xs">503</span>
                                            <strong>Server Gemini quá tải</strong>
                                        </div>
                                        <p className="text-gray-600 text-xs">
                                            Server Google Gemini đang quá tải hoặc bảo trì.
                                            <strong> Giải pháp:</strong> Đợi vài phút rồi thử lại. Nếu vẫn lỗi,
                                            thử chọn model khác (ví dụ: Gemini 2.5 Flash Lite).
                                        </p>
                                    </div>

                                    {/* Error 400 */}
                                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-mono text-xs">400</span>
                                            <strong>Yêu cầu không hợp lệ</strong>
                                        </div>
                                        <p className="text-gray-600 text-xs">
                                            Có thể API Key không đúng định dạng hoặc model không được hỗ trợ.
                                            <strong> Giải pháp:</strong> Kiểm tra lại API Key và model đã chọn.
                                        </p>
                                    </div>

                                    {/* Error 403 */}
                                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-mono text-xs">403</span>
                                            <strong>API Key không hợp lệ</strong>
                                        </div>
                                        <p className="text-gray-600 text-xs">
                                            API Key đã hết hạn, bị revoke, hoặc không có quyền truy cập.
                                            <strong> Giải pháp:</strong> Tạo API Key mới từ Google AI Studio.
                                        </p>
                                    </div>

                                    {/* Error 500 */}
                                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono text-xs">500</span>
                                            <strong>Lỗi server nội bộ</strong>
                                        </div>
                                        <p className="text-gray-600 text-xs">
                                            Có lỗi không xác định từ server.
                                            <strong> Giải pháp:</strong> Thử lại sau vài phút. Nếu vẫn lỗi,
                                            liên hệ quản trị viên.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
