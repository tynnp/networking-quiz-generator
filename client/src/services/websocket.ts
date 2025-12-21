const getWsBaseUrl = (): string => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'ws://localhost:8000';
    }

    return `${protocol}//${hostname}:8000`;
};

export const WS_BASE_URL = getWsBaseUrl();

export function createChatWebSocket(token: string): WebSocket {
    const wsUrl = `${WS_BASE_URL}/ws/chat?token=${encodeURIComponent(token)}`;
    return new WebSocket(wsUrl);
}

export interface ChatWebSocketMessage {
    type: 'message' | 'system' | 'online_users' | 'private_message' | 'private_sent';
    id?: string;
    userId?: string;
    userName?: string;
    content?: string;
    timestamp?: string;
    users?: Array<{ id: string; name: string }>;
    from?: { id: string; name: string };
    to?: string;
}

export interface SendChatMessage {
    type: 'message' | 'private';
    content: string;
    to?: string;
}
