import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const SHOPS_TABLE = process.env.DYNAMODB_TABLE_SHOP || 'shop-table-dev';

interface Shop {
    shopId: string;
    shopUid: string;
    createdAt: string;
}

export const generateShopId = () => {
    return nanoid();
}

export const getShopByUid = async (shopUid: string): Promise<Shop> => {
    // shopUid is not primary key, so we need to use query

    const params = {
        TableName: SHOPS_TABLE,
        IndexName: 'shopUid-createdAt-index',
        KeyConditionExpression: 'shopUid = :shopUid',
        ExpressionAttributeValues: {
            ':shopUid': shopUid,
        },
    };

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    return Items?.[0] as Shop;
}
