import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TelegramUpdate, TelegramUser } from './telegram.schema';

const TELEGRAM_WEBHOOKS_TABLE =
    process.env.DYNAMODB_TABLE_TELEGRAM_WEBHOOK || 'telegram-webhooks-table-dev';
const TELEGRAM_USERS_TABLE =
    process.env.DYNAMODB_TABLE_TELEGRAM_USER || 'telegram-users-table-dev';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

/**
 * Record received Telegram webhook udpate
 * @param {TelegramUpdate} update
 */
export const recordTelegramWebHook = async (update: TelegramUpdate) => {
    const params = {
        TableName: TELEGRAM_WEBHOOKS_TABLE,
        Item: {
            updateId: update?.update_id,
            fromId: update?.message?.from?.id,
            fromUsername: update?.message?.from?.username,
            message: update?.message,
        },
    };

    try {
        await dynamoDbClient.send(new PutCommand(params));
    } catch (error) {
        console.log(error);
        throw error;
    }
};

/**
 *
 * @param {Number} userId
 * @returns
 */
export const getTelegramUserById = async (userId: number) => {
    const params = {
        TableName: TELEGRAM_USERS_TABLE,
        Key: {
            telegramUserId: Number(userId),
        },
    };

    try {
        const { Item } = await dynamoDbClient.send(new GetCommand(params));
        return Item;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

/**
 *
 * @param {TelegramUser} user
 * @param {string} customerId
 * @param {string} orderId
 */
export const recordTelegramUser = async (user: TelegramUser, customerId: string, orderId: string) => {
    try {
        const existingUser = await module.exports.getTelegramUserById(
            user?.id
        );
        if (existingUser) {
            // update dynamodb record with userId and orderId
            const params = {
                TableName: TELEGRAM_WEBHOOKS_TABLE,
                Key: {
                    telegramUserId: existingUser.telegramUserId,
                },
                UpdateExpression:
                    'SET customerIds = list_append(customerIds, :customerId), orderIds = list_append(orderIds, :orderId)',
                ExpressionAttributeValues: {
                    ':customerId': customerId,
                    ':orderId': orderId,
                },
            };
            await dynamoDbClient.send(new UpdateCommand(params));
        } else {
            const params = {
                TableName: TELEGRAM_USERS_TABLE,
                Item: {
                    telegramUserId: user?.id,
                    isBot: user?.is_bot,
                    firstName: user?.first_name,
                    lastName: user?.last_name,
                    username: user?.username,
                    languageCode: user?.language_code,
                    customerIds: customerId ? [customerId] : [],
                    orderIds: orderId ? [orderId] : [],
                },
            };
            await dynamoDbClient.send(new PutCommand(params));
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getTelegramUsersUsingUserId = async (customerId: string) => {
    const params = {
        TableName: TELEGRAM_USERS_TABLE,
        FilterExpression: 'contains(customerId, :customerId)',
        ExpressionAttributeValues: {
            ':customerId': customerId,
        },
    };

    try {
        const { Items, Count } = await dynamoDbClient.send(new ScanCommand(params));
        return {
            Items,
            Count,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

/**
 * 
 * @param {string} orderId 
 * @returns 
 */
export const getTelegramUsersUsingOrderId = async (orderId: string) => {
    const params = {
        TableName: TELEGRAM_USERS_TABLE,
        FilterExpression: 'contains(orderIds, :orderId)',
        ExpressionAttributeValues: {
            ':orderId': orderId,
        },
    };

    try {
        const { Count, Items } = await dynamoDbClient.send(new ScanCommand(params));
        return {
            Count,
            Items,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};
