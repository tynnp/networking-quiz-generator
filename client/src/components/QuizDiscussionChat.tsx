import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken, getDiscussionMessages, getDiscussionQuiz } from '../services/api';
import { createDiscussionWebSocket, DiscussionWebSocketMessage, SendDiscussionMessage } from '../services/websocket';
import { DiscussionMessage, OnlineUser, Quiz, Question } from '../types';
import { Send, ArrowLeft, Users, MessageSquare, ChevronDown, ChevronUp, Quote, HelpCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizDiscussionChatProps {
    quizId: string;
    quizTitle: string;
    onBack: () => void;
}

export default function QuizDiscussionChat({ quizId, quizTitle, onBack }: QuizDiscussionChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);

    // Quiz data
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(true);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [showQuestions, setShowQuestions] = useState(true);

    // Mobile panel visibility
    const [showMobileQuestions, setShowMobileQuestions] = useState(false);
    const [showMobileOnline, setShowMobileOnline] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const isConnectingRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Load quiz data
    useEffect(() => {
        const loadQuiz = async () => {
            try {
                setLoadingQuiz(true);
                const data = await getDiscussionQuiz(quizId);
                setQuiz(data);
            } catch (error) {
                console.error('Failed to load quiz:', error);
            } finally {
                setLoadingQuiz(false);
            }
        };
        loadQuiz();
    }, [quizId]);

    // Load initial messages
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await getDiscussionMessages(quizId, 100);
                setMessages(data);
            } catch (error) {
                console.error('Failed to load discussion messages:', error);
            }
        };
        loadMessages();
    }, [quizId]);

    // WebSocket connection
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setIsConnecting(false);
            return;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            return;
        }
        if (isConnectingRef.current) {
            return;
        }

        isConnectingRef.current = true;

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const ws = createDiscussionWebSocket(token, quizId);
        wsRef.current = ws;

        ws.onopen = () => {
            isConnectingRef.current = false;
            setIsConnected(true);
            setIsConnecting(false);
        };

        ws.onclose = () => {
            isConnectingRef.current = false;
            setIsConnected(false);
            setIsConnecting(false);
        };

        ws.onerror = () => {
            isConnectingRef.current = false;
            setIsConnected(false);
            setIsConnecting(false);
        };

        ws.onmessage = (event) => {
            try {
                const data: DiscussionWebSocketMessage = JSON.parse(event.data);

                switch (data.type) {
                    case 'message':
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: data.id!,
                                quizId: quizId,
                                userId: data.userId!,
                                userName: data.userName!,
                                content: data.content!,
                                timestamp: data.timestamp!,
                            },
                        ]);
                        break;

                    case 'online_users':
                        setOnlineUsers(data.users || []);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        return () => {
            isConnectingRef.current = false;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [quizId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !wsRef.current || !isConnected) return;

        const message: SendDiscussionMessage = {
            type: 'message',
            content: inputMessage.trim(),
        };

        wsRef.current.send(JSON.stringify(message));
        setInputMessage('');
    };

    const quoteQuestion = (question: Question, index: number) => {
        const quoteText = `[Câu ${index + 1}] "${question.content.substring(0, 80)}${question.content.length > 80 ? '...' : ''}" - `;
        setInputMessage(prev => quoteText + prev);
        inputRef.current?.focus();
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return { text: 'Dễ', class: 'bg-green-100 text-green-700' };
            case 'medium': return { text: 'TB', class: 'bg-yellow-100 text-yellow-700' };
            case 'hard': return { text: 'Khó', class: 'bg-red-100 text-red-700' };
            default: return { text: difficulty, class: 'bg-gray-100 text-gray-700' };
        }
    };

    // Render message with question references highlighted and markdown support
    const renderMessageContent = (content: string, isOwnMessage: boolean) => {
        const parts = content.split(/(\[Câu \d+\])/g);
        return parts.map((part, i) => {
            if (part.match(/\[Câu \d+\]/)) {
                return <span key={i} className={`font-semibold ${isOwnMessage ? 'text-blue-200' : 'text-blue-600'}`}>{part}</span>;
            }
            // Use ReactMarkdown for text parts to support markdown/formatting
            return (
                <ReactMarkdown
                    key={i}
                    components={{
                        p: ({ children }) => <span>{children}</span>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className={`px-1 rounded ${isOwnMessage ? 'bg-white/20' : 'bg-gray-200'}`}>{children}</code>,
                    }}
                >
                    {part}
                </ReactMarkdown>
            );
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#124874]" />
                    </button>
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-[#124874]" />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm md:text-xl font-bold text-[#124874] truncate">
                            Thảo luận đề thi: {quizTitle}
                        </h1>
                        {quiz && (
                            <p className="text-xs text-gray-500 hidden sm:block">
                                {quiz.questions.length} câu hỏi • {quiz.duration} phút
                            </p>
                        )}
                    </div>
                    {/* Mobile buttons */}
                    <button
                        onClick={() => setShowMobileQuestions(true)}
                        className="md:hidden p-2 text-[#124874] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Xem câu hỏi"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowMobileOnline(true)}
                        className="md:hidden p-2 text-[#124874] hover:bg-gray-100 rounded-lg transition-colors relative"
                        title="Xem người online"
                    >
                        <Users className="w-5 h-5" />
                        <span className="absolute -top-0.5 -right-0.5 bg-[#124874] text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center">
                            {onlineUsers.length}
                        </span>
                    </button>
                    <span
                        className={`px-2 py-1 rounded-full text-xs hidden sm:inline ${isConnected
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                    >
                        {isConnecting
                            ? 'Đang kết nối...'
                            : isConnected
                                ? 'Đã kết nối'
                                : 'Mất kết nối'}
                    </span>
                </div>
            </div>

            {/* Main content - 2 columns */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Chat area - Left */}
                <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col min-h-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Chưa có tin nhắn nào.</p>
                                <p className="text-sm mt-1 hidden md:block">Click vào câu hỏi bên phải để trích dẫn và thảo luận!</p>
                                <p className="text-sm mt-1 md:hidden">Nhấn nút <HelpCircle className="w-4 h-4 inline" /> ở trên để xem câu hỏi!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 ${msg.userId === user?.id
                                            ? 'bg-[#124874] text-white'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {msg.userId !== user?.id && (
                                            <div className="text-xs font-semibold mb-1 text-[#124874]">
                                                {msg.userName}
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap text-sm md:text-base">{renderMessageContent(msg.content, msg.userId === user?.id)}</div>
                                        <div
                                            className={`text-xs mt-1 ${msg.userId === user?.id
                                                ? 'text-white/70'
                                                : 'text-gray-500'
                                                }`}
                                        >
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-3 md:p-4 border-t">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm md:text-base"
                                disabled={!isConnected}
                            />
                            <button
                                type="submit"
                                disabled={!isConnected || !inputMessage.trim()}
                                className="px-3 md:px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Panel - Questions on top, Online users on bottom - Desktop only */}
                <div className="w-72 flex-col gap-4 hidden md:flex">
                    {/* Quiz Questions Panel */}
                    <div className={`bg-white rounded-lg shadow-md flex flex-col ${showQuestions ? 'flex-1 min-h-0' : ''}`}>
                        <div className={`p-4 ${showQuestions ? 'border-b' : ''}`}>
                            <button
                                onClick={() => setShowQuestions(!showQuestions)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-[#124874]" />
                                    <h2 className="font-semibold text-[#124874]">Câu hỏi trong đề</h2>
                                </div>
                                {showQuestions ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                            {showQuestions && (
                                <p className="text-xs text-gray-500 mt-1">Click để trích dẫn vào chat</p>
                            )}
                        </div>

                        {showQuestions && (
                            <div className="flex-1 overflow-y-auto p-2">
                                {loadingQuiz ? (
                                    <div className="text-center text-gray-500 py-4 text-sm">
                                        Đang tải câu hỏi...
                                    </div>
                                ) : !quiz ? (
                                    <div className="text-center text-gray-500 py-4 text-sm">
                                        Không thể tải câu hỏi
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {quiz.questions.map((q, index) => {
                                            const difficulty = getDifficultyLabel(q.difficulty);
                                            const isExpanded = expandedQuestion === q.id;

                                            return (
                                                <div
                                                    key={q.id}
                                                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                                >
                                                    {/* Question header */}
                                                    <div
                                                        className="p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                        onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-bold text-[#124874] text-sm min-w-[45px]">
                                                                Câu {index + 1}
                                                            </span>
                                                            <p className="text-xs text-gray-700 line-clamp-2 flex-1">
                                                                {q.content}
                                                            </p>
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${difficulty.class}`}>
                                                                {difficulty.text}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Expanded content */}
                                                    {isExpanded && (
                                                        <div className="p-2 border-t bg-white">
                                                            <p className="text-sm text-gray-800 mb-2">{q.content}</p>
                                                            <div className="space-y-1 mb-3">
                                                                {q.options.map((opt, optIndex) => (
                                                                    <div
                                                                        key={optIndex}
                                                                        className={`text-xs p-1.5 rounded ${optIndex === q.correctAnswer
                                                                            ? 'bg-green-100 text-green-800 font-medium'
                                                                            : 'bg-gray-50 text-gray-600'
                                                                            }`}
                                                                    >
                                                                        {String.fromCharCode(65 + optIndex)}. {opt}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {q.explanation && (
                                                                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded mb-2">
                                                                    <strong>Giải thích:</strong> {q.explanation}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => quoteQuestion(q, index)}
                                                                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-[#124874] text-white rounded text-xs hover:bg-[#0d3351] transition-colors"
                                                            >
                                                                <Quote className="w-3 h-3" />
                                                                Trích dẫn câu này
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Online users - Bottom (expands when questions collapsed) */}
                    <div className={`bg-white rounded-lg shadow-md flex flex-col ${showQuestions ? '' : 'flex-1'}`} style={showQuestions ? { maxHeight: '60px' } : {}}>
                        <div className={`p-4 ${!showQuestions ? 'border-b' : ''}`}>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#124874]" />
                                <h2 className="font-semibold text-[#124874]">Đang online</h2>
                                <span className="ml-auto bg-[#124874] text-white text-xs px-2 py-0.5 rounded-full">
                                    {onlineUsers.length}
                                </span>
                            </div>
                        </div>
                        {!showQuestions && (
                            <div className="flex-1 overflow-y-auto p-2">
                                {onlineUsers.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4 text-sm">
                                        Không có ai online
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {onlineUsers.map(onlineUser => (
                                            <div
                                                key={onlineUser.id}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                                            >
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-sm truncate flex-1">
                                                    {onlineUser.name}
                                                    {onlineUser.id === user?.id && <span className="text-gray-400 ml-1">(Bạn)</span>}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Questions Panel Overlay */}
            {showMobileQuestions && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileQuestions(false)}>
                    <div className="absolute right-0 top-0 h-full w-80 max-w-[90%] bg-white flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-[#124874]" />
                                <h2 className="font-semibold text-[#124874]">Câu hỏi trong đề</h2>
                            </div>
                            <button
                                onClick={() => setShowMobileQuestions(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 px-4 py-2 border-b">Nhấn vào câu hỏi để trích dẫn vào chat</p>
                        <div className="flex-1 overflow-y-auto p-3">
                            {loadingQuiz ? (
                                <div className="text-center text-gray-500 py-4 text-sm">
                                    Đang tải câu hỏi...
                                </div>
                            ) : !quiz ? (
                                <div className="text-center text-gray-500 py-4 text-sm">
                                    Không thể tải câu hỏi
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {quiz.questions.map((q, index) => {
                                        const difficulty = getDifficultyLabel(q.difficulty);
                                        const isExpanded = expandedQuestion === q.id;

                                        return (
                                            <div
                                                key={q.id}
                                                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div
                                                    className="p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="font-bold text-[#124874] text-sm min-w-[45px]">
                                                            Câu {index + 1}
                                                        </span>
                                                        <p className="text-xs text-gray-700 line-clamp-2 flex-1">
                                                            {q.content}
                                                        </p>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${difficulty.class}`}>
                                                            {difficulty.text}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-2 border-t bg-white">
                                                        <p className="text-sm text-gray-800 mb-2">{q.content}</p>
                                                        <div className="space-y-1 mb-3">
                                                            {q.options.map((opt, optIndex) => (
                                                                <div
                                                                    key={optIndex}
                                                                    className={`text-xs p-1.5 rounded ${optIndex === q.correctAnswer
                                                                        ? 'bg-green-100 text-green-800 font-medium'
                                                                        : 'bg-gray-50 text-gray-600'
                                                                        }`}
                                                                >
                                                                    {String.fromCharCode(65 + optIndex)}. {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {q.explanation && (
                                                            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded mb-2">
                                                                <strong>Giải thích:</strong> {q.explanation}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                quoteQuestion(q, index);
                                                                setShowMobileQuestions(false);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-[#124874] text-white rounded text-xs hover:bg-[#0d3351] transition-colors"
                                                        >
                                                            <Quote className="w-3 h-3" />
                                                            Trích dẫn câu này
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
                </div>
            )}

            {/* Mobile Online Users Panel Overlay */}
            {showMobileOnline && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileOnline(false)}>
                    <div className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-white flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#124874]" />
                                <h2 className="font-semibold text-[#124874]">Đang online</h2>
                                <span className="ml-2 bg-[#124874] text-white text-xs px-2 py-0.5 rounded-full">
                                    {onlineUsers.length}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowMobileOnline(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                            {onlineUsers.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 text-sm">
                                    Không có ai online
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {onlineUsers.map(onlineUser => (
                                        <div
                                            key={onlineUser.id}
                                            className="flex items-center gap-2 p-3 rounded-lg bg-gray-50"
                                        >
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-sm truncate flex-1">
                                                {onlineUser.name}
                                                {onlineUser.id === user?.id && <span className="text-gray-400 ml-1">(Bạn)</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}