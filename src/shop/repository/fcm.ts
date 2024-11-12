import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Converter } from 'aws-sdk/clients/dynamodb';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const FCM_TOKEN_TABLE = process.env.DYNAMODB_TABLE_FCM_TOKEN || 'fcm-tokens-table-dev';

export interface FcmToken {
    fcmToken?: string;
    userId?: string;
    shopIds?: string[];
    createdAt?: string;
}

export const getFcmToken = async (fcmToken: string): Promise<FcmToken> => {
    const params = {
        TableName: FCM_TOKEN_TABLE,
        Key: {
            fcmToken,
        },
    };

    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    return Item as FcmToken;
}

export const getFcmTokensWithShopId = async (shopId: string): Promise<FcmToken[]> => {
    const params = {
        TableName: FCM_TOKEN_TABLE,
        FilterExpression: 'contains(shopIds, :shopId)',
        ExpressionAttributeValues: {
            ':shopId': { S: shopId },
        },
    };

    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    return (Items || []).map((item) => Converter.unmarshall(item)) as FcmToken[];
}

export const registerFcmToken = async (fcmToken: string, userId?: string, shopIds?: string[]): Promise<FcmToken> => {
    const params = {
        TableName: FCM_TOKEN_TABLE,
        Item: {
            fcmToken,
            userId,
            shopIds,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return getFcmToken(fcmToken);
}

export const deregisterFcmToken = async (fcmToken: string) => {
    const params = {
        TableName: FCM_TOKEN_TABLE,
        Key: {
            fcmToken,
        },
    }

    await dynamoDbClient.send(new DeleteCommand(params));
}
