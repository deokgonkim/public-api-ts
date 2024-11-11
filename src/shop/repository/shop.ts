import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { UserProfile } from '../cognito/api';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const SHOPS_TABLE = process.env.DYNAMODB_TABLE_SHOP || 'shop-table-dev';
const USERSHOPS_TABLE = process.env.DYNAMODB_TABLE_USERSHOP || 'usershop-table-dev';

interface ShopUser {
    role: string;
    userId: string;
    username?: string;
}

interface Shop {
    shopId: string;
    shopUid: string;
    createdAt: string;
}

export interface UserShop {
    userId: string;
    shopId: string;
    role: string;
    shop?: Shop;
}

export const generateShopId = () => {
    return nanoid();
}

export const getShop = async (shopId: string): Promise<Shop> => {
    const params = {
        TableName: SHOPS_TABLE,
        Key: {
            shopId,
        },
    };

    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    return Item as Shop;
}

export const createShop = async (shopUid: string): Promise<Shop> => {
    const shopId = generateShopId();
    const params = {
        TableName: SHOPS_TABLE,
        Item: {
            shopId,
            shopUid,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return params.Item as Shop;
}

export const createUserShop = async (userId: string, shopId: string, userProfile: UserProfile, role: string): Promise<ShopUser> => {
    const params = {
        TableName: USERSHOPS_TABLE,
        Item: {
            userId,
            shopId,
            role,
            username: userProfile.username,
        },
    };

    await dynamoDbClient.send(new PutCommand(params));
    return params.Item as UserShop;
}

export const getShopByUid = async (shopUid: string): Promise<Shop> => {
    // shopUid is not primary key, so we need to use query

    const params = {
        TableName: SHOPS_TABLE,
        IndexName: 'shopUid-index',
        KeyConditionExpression: 'shopUid = :shopUid',
        ExpressionAttributeValues: {
            ':shopUid': shopUid,
        },
    };

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    return Items?.[0] as Shop;
}

export const getShopsForUser = async (userId: string): Promise<{
    shopId: string;
    shopUid: string;
    role: string;
    shop: Shop;
}[]> => {
    const params = {
        TableName: USERSHOPS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
    }

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    const shopIds = Items?.map((item) => (item as UserShop).shopId) || [];
    return Promise.all(shopIds.map(async (shopId) => {
        const shop = await getShop(shopId);
        const userShop = Items?.find((item) => (item as UserShop).shopId === shopId);
        return {
            shopId,
            shopUid: shop?.shopUid as string,
            role: userShop?.role as string,
            shop,
        };
    }));
}

export const isAuthorized = async (userId: string, shopId: string): Promise<boolean> => {
    const shop = await getShop(shopId);
    if (!shop) {
        throw new Error(`Shop with shopId ${shopId} not found`);
    }
    const params = {
        TableName: USERSHOPS_TABLE,
        Key: {
            userId,
            shopId: shop.shopId,
        },
    };

    try {
        const { Item } = await dynamoDbClient.send(new GetCommand(params));
        return !!Item;
    } catch (error) {
        return false;
    }
}
