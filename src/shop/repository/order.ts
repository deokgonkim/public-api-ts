import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.DYNAMODB_TABLE_ORDER || 'order-table-dev';

interface Order {
    orderId: string;
    shopId: string;
    items: string[];
    total: number;
    createdAt: string;
}

export const generateOrderId = () => {
    return nanoid();
}

export const getOrdersForShop = async (shopId: string): Promise<Order[]> => {
    const params = {
        TableName: ORDERS_TABLE,
        IndexName: 'shopId-createdAt-index',
        KeyConditionExpression: 'shopId = :shopId',
        ExpressionAttributeValues: {
            ':shopId': shopId,
        },
    };

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    return Items as Order[];
}

export const createOrder = async (shopId: string, customerId: string, body: any): Promise<string> => {
    const orderId = generateOrderId();
    const total = body.items.reduce((acc: number, item: any) => {
        return acc + item.price;
    }, 0);

    const params = {
        TableName: ORDERS_TABLE,
        Item: {
            orderId,
            shopId,
            customerId,
            items: body.items,
            total,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return orderId;
}
