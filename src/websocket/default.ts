
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Message, MessageType, ChatMessage, ResponseMessage, AuthRequestMessage, AuthResponseMessage } from './types';
import { Socket } from "../shop/repository";
import { complete } from "./openai";


const getWebSocketEndpoint = (event: APIGatewayProxyEvent): string => {
    const { domainName, stage } = event.requestContext;
    return `https://${domainName}/${stage}`;
};

// const websocketUrl = process.env.WEBSOCKET_ENDPOINT?.replace('wss:', 'https:');

// const apiGatewayClient = new ApiGatewayManagementApiClient({
//     endpoint: websocketUrl, // e.g., "your-api-id.execute-api.region.amazonaws.com/production"
// });

// const exampleRequestMessage: RequestMessage = {
//     messageId: 'example-request',
//     type: MessageType.REQUEST,
//     action: 'example',
//     data: 'example',
// };

// const exampleResponseMessage: ResponseMessage = {
//     messageId: 'example-response',
//     type: MessageType.RESPONSE,
//     status: 'success',
//     data: 'example',
//     requestMessageId: 'example',
// };

// const exampleAuthRequestMessage: AuthRequestMessage = {
//     messageId: 'example-auth-request',
//     type: MessageType.AUTH_REQUEST,
//     action: 'auth',
//     data: 'example',
// };

// const exampleAuthResponseMessage: AuthResponseMessage = {
//     messageId: 'example-auth-response',
//     type: MessageType.AUTH_RESPONSE,
//     status: 'success',
//     data: 'example',
//     requestMessageId: 'example',
// };

export const handler = async (event) => {
    console.log('event', JSON.stringify(event, null, 4));
    const connectionId = event.requestContext.connectionId;
    const requestId = event.requestContext.requestId;
    let messageData;

    const websocketUrl = getWebSocketEndpoint(event);
    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: websocketUrl, // e.g., "your-api-id.execute-api.region.amazonaws.com/production"
    });
    try {
        const receivedBody = JSON.parse(event?.body);
        console.log('receivedBody', receivedBody);

        let message: Message;
        try {
            message = JSON.parse(event.body) as Message;
        } catch (error) {
            console.error('Invalid message format', error);
            return { statusCode: 400, body: 'Invalid message format' };
        }

        let response: Message | null = null;

        switch (message.type) {
            case MessageType.AUTH_REQUEST:
                console.log('Received auth request', message);
                const username = (message as AuthRequestMessage).data;
                console.log('registering connection', connectionId, username);
                await Socket.registerConnection(connectionId, undefined, username);
                response = <AuthResponseMessage>{
                    type: MessageType.AUTH_RESPONSE,
                    status: 'success',
                    data: 'auth success',
                    requestMessageId: message.messageId,
                }
                break;
            case MessageType.CHAT:
                console.log('Received chat message', message);
                // response = <ChatMessage>{
                //     type: MessageType.CHAT,
                //     data: '[responsed]',
                // }
                response = null;
                // TODO rate limit 구현 요망!!
                await complete(message.data!).then(async (stream) => {
                    for await (const chunk of stream) {
                        const message = chunk.choices?.[0]?.delta?.content;
                        console.log('sending', message)
                        if (message) {
                            const command = new PostToConnectionCommand({
                                ConnectionId: connectionId,
                                Data: JSON.stringify({
                                    type: 'chat',
                                    data: message
                                }, null, 4),
                            });
                            await apiGatewayClient.send(command);
                        }
                    }
                });
                break;
            case MessageType.REQUEST:
                console.log('Received request message', message);
                response = <ResponseMessage>{
                    type: MessageType.RESPONSE,
                    status: 'success',
                    data: 'request received',
                    requestMessageId: message.messageId,
                }
                break;
            case MessageType.RESPONSE:
                console.log('Received response message', message);
                response = <ResponseMessage>{
                    type: MessageType.RESPONSE,
                    status: 'success',
                    data: 'response received',
                    requestMessageId: message.messageId,
                }
                break;
            default:
                console.error('Unknown message type', message.type);
                response = <ResponseMessage>{
                    type: MessageType.RESPONSE,
                    status: 'error',
                    error: {
                        code: 'unknown-message-type',
                        message: 'Unknown message type',
                    },
                    requestMessageId: message.messageId,
                }
        }

        if (response) {
            // to send a message to client, we should use api gateway method `postToConnection`
            const command = new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(response, null, 4),
            });

            await apiGatewayClient.send(command);
        }
    } catch (err) {
        console.error('Error WSURL:', websocketUrl);
        console.error("Error posting to connection:", err);
        // Optionally handle stale connections by removing them from your database
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify({
                messageId: `request-${requestId}`,
                type: 'error',
                status: 'error',
                error: {
                    code: 'unknown-error',
                    message: err.message,
                }
            }),
        });
        await apiGatewayClient.send(command);
    }

    // returning message is not sent to the client
    return { statusCode: 200, body: "Message sent." };
    // return {
    //     statusCode: 200,
    //     body: JSON.stringify({
    //         message: 'defaultHandler',
    //         event,
    //     }),
    // };
};
