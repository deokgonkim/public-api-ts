import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { WebSocket, Message } from '../../websocket/types';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const SOCKETS_TABLE = process.env.DYNAMODB_TABLE_SOCKET || 'socket-table-dev';
const MESSAGES_TABLE = process.env.DYNAMODB_TABLE_SOCKET_MESSAGE || 'socket-message-table-dev';


export const getConnection = async (connectionId: string): Promise<WebSocket> => {
    const params = {
        TableName: SOCKETS_TABLE,
        Key: {
            connectionId,
        },
    };

    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    return Item as WebSocket;
}

export const getConnectionsByUserId = async (userId: string): Promise<WebSocket[]> => {
    const params = {
        TableName: SOCKETS_TABLE,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
    };

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    return Items as WebSocket[];
}

export const registerConnection = async (connectionId: string, shopId?: string, userId?: string): Promise<WebSocket> => {
    const params = {
        TableName: SOCKETS_TABLE,
        Item: {
            connectionId,
            shopId,
            userId,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return getConnection(connectionId);
}

export const deleteConnection = async (connectionId: string) => {
    // const params = {
    //     TableName: SOCKETS_TABLE,
    //     Key: {
    //         connectionId,
    //     },
    // }

    // await dynamoDbClient.send(new DeleteCommand(params));
    // soft delete
    const params = {
        TableName: SOCKETS_TABLE,
        Key: {
            connectionId,
        },
        UpdateExpression: 'set deletedAt = :deletedAt',
        ExpressionAttributeValues: {
            ':deletedAt': new Date().toISOString(),
        },
    };
    await dynamoDbClient.send(new UpdateCommand(params));
}


export const recordMessage = async (messageId: string, connectionId: string, message: Message) => {
    if (!messageId) {
        messageId = nanoid();
    }
    const params = {
        TableName: MESSAGES_TABLE,
        Item: {
            messageId,
            connectionId,
            message,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return getConnection(connectionId);
}
