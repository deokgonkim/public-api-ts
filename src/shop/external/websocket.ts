import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { ChatMessage, MessageType } from '../../websocket/types';
import { Socket } from '../repository';

const websocketUrl = process.env.WEBSOCKET_API_ID ? `https://${process.env.WEBSOCKET_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.STAGE}` : '';

export const websocketSend = async (userId: string, payload: any) => {
    const connections = await Socket.getConnectionsByUserId(userId);
    console.log('connections', connections);

    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: websocketUrl, // e.g., "your-api-id.execute-api.region.amazonaws.com/production"
    });

    for (const connection of connections) {
        const message = {
            messageId: `chat-${Date.now()}`,
            type: MessageType.CHAT,
            data: JSON.stringify(payload),
        }
        await Socket.recordMessage(message.messageId, connection.connectionId, message)
        const command = new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: JSON.stringify(message),
        });
        await apiGatewayClient.send(command).catch((error) => {
            console.warn('Failed to send message', error);
        });
    }
}