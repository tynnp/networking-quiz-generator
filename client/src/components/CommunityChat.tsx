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

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken, getChatMessages, getPrivateChatMessages, deletePrivateChat, deleteAllChatMessages } from '../services/api';
import { createChatWebSocket, ChatWebSocketMessage, SendChatMessage } from '../services/websocket';
import { ChatMessage, OnlineUser, PrivateMessage } from '../types';
import { Send, MessageCircle, Users, ArrowLeft, Trash2, X, AlertTriangle } from 'lucide-react';

export default function CommunityChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);

    const [privateChatUser, setPrivateChatUser] = useState<OnlineUser | null>(null);
    const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
    const [privateInputMessage, setPrivateInputMessage] = useState('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const wsRef = useRef<WebSocket | null>(null);
    const isConnectingRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const privateMessagesEndRef = useRef<HTMLDivElement>(null);

    const [showDeletePrivateModal, setShowDeletePrivateModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const scrollToPrivateBottom = useCallback(() => {
        privateMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await getChatMessages(100);
                setMessages(response.messages);
            } catch (error) {
                console.error('Failed to load chat messages:', error);
            }
        };
        loadMessages();
    }, []);

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

        const ws = createChatWebSocket(token);
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
                const data: ChatWebSocketMessage = JSON.parse(event.data);

                switch (data.type) {
                    case 'message':
                        setMessages(prev => [...prev, {
                            id: data.id!,
                            userId: data.userId!,
                            userName: data.userName!,
                            content: data.content!,
                            timestamp: data.timestamp!
                        }]);
                        break;

                    case 'online_users':
                        setOnlineUsers(data.users || []);
                        break;

                    case 'private_message':
                        if (data.from) {
                            const newMsg: PrivateMessage = {
                                id: `pmsg-${Date.now()}`,
                                userId: data.from.id,
                                userName: data.from.name,
                                fromUserId: data.from.id,
                                fromUserName: data.from.name,
                                toUserId: user?.id || '',
                                content: data.content!,
                                timestamp: data.timestamp!
                            };

                            setPrivateChatUser(current => {
                                if (current && data.from!.id === current.id) {
                                    setPrivateMessages(prev => [...prev, newMsg]);
                                } else {
                                    setUnreadCounts(prev => ({
                                        ...prev,
                                        [data.from!.id]: (prev[data.from!.id] || 0) + 1
                                    }));
                                }
                                return current;
                            });
                        }
                        break;

                    case 'private_sent':
                        setPrivateChatUser(current => {
                            if (current && data.to === current.id) {
                                setPrivateMessages(prev => [...prev, {
                                    id: `pmsg-sent-${Date.now()}`,
                                    userId: user?.id || '',
                                    userName: user?.name || '',
                                    fromUserId: user?.id || '',
                                    fromUserName: user?.name || '',
                                    toUserId: data.to!,
                                    content: data.content!,
                                    timestamp: data.timestamp!
                                }]);
                            }
                            return current;
                        });
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
    }, [user?.id, user?.name]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        scrollToPrivateBottom();
    }, [privateMessages, scrollToPrivateBottom]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !wsRef.current || !isConnected) return;

        const message: SendChatMessage = {
            type: 'message',
            content: inputMessage.trim()
        };

        wsRef.current.send(JSON.stringify(message));
        setInputMessage('');
    };

    const sendPrivateMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!privateInputMessage.trim() || !wsRef.current || !isConnected || !privateChatUser) return;

        const message: SendChatMessage = {
            type: 'private',
            content: privateInputMessage.trim(),
            to: privateChatUser.id
        };

        wsRef.current.send(JSON.stringify(message));
        setPrivateInputMessage('');
    };

    const openPrivateChat = async (targetUser: OnlineUser) => {
        if (targetUser.id === user?.id) return;

        setPrivateChatUser(targetUser);
        setPrivateMessages([]);
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[targetUser.id];
            return newCounts;
        });

        try {
            const response = await getPrivateChatMessages(targetUser.id, 50);
            setPrivateMessages(response.messages);
        } catch (error) {
            console.error('Failed to load private messages:', error);
        }
    };

    const closePrivateChat = () => {
        setPrivateChatUser(null);
        setPrivateMessages([]);
        setPrivateInputMessage('');
    };

    const handleDeletePrivateChat = async () => {
        if (!privateChatUser) return;
        setIsDeleting(true);

        try {
            await deletePrivateChat(privateChatUser.id);
            setPrivateMessages([]);
            setShowDeletePrivateModal(false);
        } catch (error) {
            console.error('Failed to delete private chat:', error);
            alert('Không thể xóa tin nhắn');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAllMessages = async () => {
        setIsDeleting(true);

        try {
            await deleteAllChatMessages();
            setMessages([]);
            setShowDeleteAllModal(false);
        } catch (error) {
            console.error('Failed to delete all messages:', error);
            alert('Không thể xóa tin nhắn');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderOnlineUsersSidebar = (isMobile: boolean = false) => (
        <div className={`bg-white rounded-lg shadow-md flex flex-col ${isMobile ? 'w-full h-full' : 'w-64'}`}>
            <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#124874]" />
                    <h2 className="font-semibold text-[#124874]">Đang online</h2>
                    <span className="ml-auto bg-[#124874] text-white text-xs px-2 py-0.5 rounded-full">
                        {onlineUsers.length}
                    </span>
                    {isMobile && (
                        <button
                            onClick={() => setShowMobileSidebar(false)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {onlineUsers.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 text-sm">
                        Không có ai online
                    </div>
                ) : (
                    <div className="space-y-1">
                        {onlineUsers.map(onlineUser => (
                            <button
                                key={onlineUser.id}
                                onClick={() => {
                                    openPrivateChat(onlineUser);
                                    if (isMobile) setShowMobileSidebar(false);
                                }}
                                disabled={onlineUser.id === user?.id}
                                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${onlineUser.id === user?.id
                                    ? 'bg-gray-50 cursor-default'
                                    : 'hover:bg-gray-100 cursor-pointer'
                                    }`}
                            >
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm truncate flex-1">
                                    {onlineUser.name}
                                    {onlineUser.id === user?.id && <span className="text-gray-400 ml-1">(Bạn)</span>}
                                </span>
                                {unreadCounts[onlineUser.id] && unreadCounts[onlineUser.id] > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                        {unreadCounts[onlineUser.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    if (privateChatUser) {
        return (
            <div className="h-full flex flex-col">
                <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={closePrivateChat} className="p-1 hover:bg-gray-100 rounded">
                            <ArrowLeft className="w-5 h-5 text-[#124874]" />
                        </button>
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#124874]" />
                        <h1 className="text-base md:text-xl font-bold text-[#124874] truncate flex-1">Chat với {privateChatUser.name}</h1>
                        <div className="w-2 h-2 bg-green-500 rounded-full hidden md:block"></div>
                        {/* Mobile: Toggle online users sidebar */}
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="md:hidden p-2 text-[#124874] hover:bg-gray-100 rounded-lg transition-colors relative"
                            title="Xem người online"
                        >
                            <Users className="w-5 h-5" />
                            {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowDeletePrivateModal(true)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa đoạn chat"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <span className={`px-2 py-1 rounded-full text-xs hidden sm:inline ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isConnecting ? 'Đang kết nối...' : isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 min-h-0">
                    <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                            {privateMessages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <p>Chưa có tin nhắn.</p>
                                    <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện riêng!</p>
                                </div>
                            ) : (
                                privateMessages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 ${msg.fromUserId === user?.id
                                                ? 'bg-[#124874] text-white'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            <div className="text-sm md:text-base">{msg.content}</div>
                                            <div className={`text-xs mt-1 ${msg.fromUserId === user?.id ? 'text-white/70' : 'text-gray-500'}`}>
                                                {formatTime(msg.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={privateMessagesEndRef} />
                        </div>

                        <form onSubmit={sendPrivateMessage} className="p-3 md:p-4 border-t">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={privateInputMessage}
                                    onChange={(e) => setPrivateInputMessage(e.target.value)}
                                    placeholder={`Nhắn cho ${privateChatUser.name}...`}
                                    className="flex-1 px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm md:text-base"
                                    disabled={!isConnected}
                                />
                                <button
                                    type="submit"
                                    disabled={!isConnected || !privateInputMessage.trim()}
                                    className="px-3 md:px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Desktop sidebar */}
                    <div className="hidden md:block">
                        {renderOnlineUsersSidebar()}
                    </div>
                </div>

                {/* Mobile sidebar overlay */}
                {showMobileSidebar && (
                    <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileSidebar(false)}>
                        <div className="absolute right-0 top-0 h-full w-72 max-w-[85%]" onClick={e => e.stopPropagation()}>
                            {renderOnlineUsersSidebar(true)}
                        </div>
                    </div>
                )}

                {/* Delete Private Chat Confirmation Modal */}
                {showDeletePrivateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa đoạn chat</h3>
                                <button
                                    onClick={() => setShowDeletePrivateModal(false)}
                                    className="ml-auto p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <p className="text-gray-600 mb-2">
                                Bạn có chắc muốn xóa toàn bộ tin nhắn với <strong>{privateChatUser.name}</strong>?
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-yellow-800 text-sm">
                                    <strong>Lưu ý:</strong> Khi xóa đoạn chat này, người kia cũng sẽ mất tất cả tin nhắn. Hành động này không thể hoàn tác!
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeletePrivateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={isDeleting}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeletePrivateChat}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {isDeleting ? 'Đang xóa...' : 'Xóa đoạn chat'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#124874]" />
                    <h1 className="text-base md:text-xl font-bold text-[#124874] truncate flex-1">Chat với cộng đồng</h1>
                    {/* Mobile: Toggle online users sidebar */}
                    <button
                        onClick={() => setShowMobileSidebar(true)}
                        className="md:hidden p-2 text-[#124874] hover:bg-gray-100 rounded-lg transition-colors relative"
                        title="Xem người online"
                    >
                        <Users className="w-5 h-5" />
                        {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                                {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </button>
                    {user?.role === 'admin' && messages.length > 0 && (
                        <button
                            onClick={() => setShowDeleteAllModal(true)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa tất cả tin nhắn (Admin)"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs hidden sm:inline ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isConnecting ? 'Đang kết nối...' : isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <p>Chưa có tin nhắn nào.</p>
                                <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
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
                                        <div className="text-sm md:text-base">{msg.content}</div>
                                        <div className={`text-xs mt-1 ${msg.userId === user?.id ? 'text-white/70' : 'text-gray-500'}`}>
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-3 md:p-4 border-t">
                        <div className="flex gap-2">
                            <input
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

                {/* Desktop sidebar */}
                <div className="hidden md:block">
                    {renderOnlineUsersSidebar()}
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {showMobileSidebar && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileSidebar(false)}>
                    <div className="absolute right-0 top-0 h-full w-72 max-w-[85%]" onClick={e => e.stopPropagation()}>
                        {renderOnlineUsersSidebar(true)}
                    </div>
                </div>
            )}

            {/* Delete All Messages Confirmation Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa chat cộng đồng</h3>
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                className="ml-auto p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-2">
                            Bạn có chắc muốn xóa <strong>TẤT CẢ</strong> tin nhắn trong chat cộng đồng?
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-red-800 text-sm">
                                <strong>Cảnh báo:</strong> Tất cả tin nhắn của mọi người sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác!
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteAllMessages}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa tất cả'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
