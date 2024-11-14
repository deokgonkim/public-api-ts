// dynamodb sockets
export interface WebSocket {
    connectionId: string;
    userId?: string;
    shopId?: string;
}

export enum MessageType {
    AUTH_REQUEST = 'auth-request',
    AUTH_RESPONSE = 'auth-response',
    CHAT = 'chat',
    REQUEST = 'request',
    RESPONSE = 'response',
}

export interface Message {
    messageId?: string;
    type: MessageType; // type of the message (e.g., chat, system, etc.)
}

export interface ChatMessage extends Message {
    type: MessageType.CHAT;
    data: string;
}

export interface RequestMessage extends Message {
    action: string;
    data: string;
}

export interface ResponseMessage extends Message {
    status: string;
    data?: string;
    error?: {
        code: string;
        message: string;
    };
    requestMessageId?: string;
}

export interface AuthRequestMessage extends RequestMessage {
    type: MessageType.AUTH_REQUEST;
    data: string;
}

export interface AuthResponseMessage extends ResponseMessage {
    type: MessageType.AUTH_RESPONSE;
    data: string;
}
