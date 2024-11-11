import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const CUSTOMERS_TABLE = process.env.DYNAMODB_TABLE_CUSTOMER || 'customer-table-dev';

export interface Customer {
    customerId: string;
    shopId: string;
    name: string;
    phone: string;
    createdAt: string;
}

export const generateOrderId = () => {
    return nanoid();
}

export const getCustomer = async (customerId: string): Promise<Customer> => {
    const params = {
        TableName: CUSTOMERS_TABLE,
        Key: {
            customerId,
        },
    };

    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    return Item as Customer;
}

export const getCustomers = async (shopId: string): Promise<Customer[]> => {
    const params = {
        TableName: CUSTOMERS_TABLE,
        IndexName: 'shopId-createdAt-index',
        KeyConditionExpression: 'shopId = :shopId',
        ExpressionAttributeValues: {
            ':shopId': shopId,
        },
    };

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    return Items as Customer[];
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

export const createCustomer = async (shopId: string, name: string, phone: string): Promise<Customer> => {
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
    return getCustomer(customerId);
}

export const deleteCustomer = async (customerId: string) => {
    const params = {
        TableName: CUSTOMERS_TABLE,
        Key: {
            customerId,
        },
    }

    await dynamoDbClient.send(new DeleteCommand(params));
}
