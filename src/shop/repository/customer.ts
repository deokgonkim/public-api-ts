import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const CUSTOMERS_TABLE = process.env.DYNAMODB_TABLE_CUSTOMER || 'customer-table-dev';

interface Customer {
    customerId: string;
    shopId: string;
    createdAt: string;
}

export const generateOrderId = () => {
    return nanoid();
}

export const getCustomerUsingNamePhone = async (shopId: string, name: string, phone: string): Promise<Customer> => {
    const params = {
        TableName: CUSTOMERS_TABLE,
        IndexName: 'shopId-createdAt-index',
        KeyConditionExpression: 'shopId = :shopId',
        FilterExpression: '#name = :name and phone = :phone',
        ExpressionAttributeNames: {
            '#name': 'name',
        },
        ExpressionAttributeValues: {
            ':shopId': shopId,
            ':name': name,
            ':phone': phone,
        },
    };

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    return Items?.[0] as Customer;
}

export const createCustomer = async (shopId: string, name: string, phone: string): Promise<string> => {
    const customerId = generateOrderId();

    const params = {
        TableName: CUSTOMERS_TABLE,
        Item: {
            customerId,
            shopId,
            name,
            phone,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return customerId;
}
