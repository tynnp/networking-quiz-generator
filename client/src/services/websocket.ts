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

const getWsBaseUrl = (): string => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
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

export function createDiscussionWebSocket(token: string, quizId: string): WebSocket {
    const wsUrl = `${WS_BASE_URL}/ws/discussion/${quizId}?token=${encodeURIComponent(token)}`;
    return new WebSocket(wsUrl);
}

export interface DiscussionWebSocketMessage {
    type: 'message' | 'online_users' | 'error';
    id?: string;
    userId?: string;
    userName?: string;
    content?: string;
    timestamp?: string;
    users?: Array<{ id: string; name: string }>;
}

export interface SendDiscussionMessage {
    type: 'message';
    content: string;
}