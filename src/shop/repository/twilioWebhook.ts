import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ScanCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { WhatsAppMessage, WhatsAppUser } from './twilio.schema';

const WHATSAPP_WEBHOOKS_TABLE =
    process.env.DYNAMODB_TABLE_WHATSAPP_WEBHOOK || 'whatsapp-webhooks-table-dev';
const WHATSAPP_USERS_TABLE =
    process.env.DYNAMODB_TABLE_WHATSAPP_USER || 'whatsapp-users-table-dev';

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

/**
 * Record received whatsapp message
 * @param {WhatsAppMessage} message
 */
export const recordWhatsapp = async (message: WhatsAppMessage) => {
    const params = {
        TableName: WHATSAPP_WEBHOOKS_TABLE,
        Item: {
            MessageSid: message?.MessageSid,
            From: message?.From,
            To: message?.To,
            Body: message?.Body,
            message: message,
        },
    };

    try {
        await dynamoDbClient.send(new PutCommand(params));
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const findWhatsAppMessageOriginatingFrom = async (fromUser: string) => {
    const params = {
        TableName: WHATSAPP_WEBHOOKS_TABLE,
        FilterExpression: '#from = :fromUser',
        ExpressionAttributeNames: {
            '#from': 'From',
        },
        ExpressionAttributeValues: {
            ':fromUser': fromUser,
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
 * @param {string} whatsappUserId
 * @returns
 */
export const getWhatsAppUserById = async (whatsappUserId: string) => {
    const params = {
        TableName: WHATSAPP_USERS_TABLE,
        Key: {
            whatsappUserId: whatsappUserId,
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
 * @param {WhatsAppUser} user
 * @param {string} userId
 * @param {string} orderId
 */
export const recordWhatsAppUser = async (user: WhatsAppUser, customerId?: string, orderId?: string) => {
    try {
        const existingUser = await module.exports.getWhatsAppUserById(
            user?.whatsappUserId
        );
        if (existingUser) {
            // update dynamodb record with userId and orderId
            const params = {
                TableName: WHATSAPP_USERS_TABLE,
                Key: {
                    whatsappUserId: existingUser.whatsappUserId,
                },
                UpdateExpression:
                    'SET customerIds = list_append(customerIds, :customerId), orderIds = list_append(orderIds, :orderId)',
                ExpressionAttributeValues: {
                    ':customerId': [customerId],
                    ':orderId': [orderId],
                },
            };
            await dynamoDbClient.send(new UpdateCommand(params));
        } else {
            const params = {
                TableName: WHATSAPP_USERS_TABLE,
                Item: {
                    whatsappUserId: user?.whatsappUserId,
                    ProfileName: user?.ProfileName,
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

export const getWhatsAppUsersUsingUserId = async (customerId: string) => {
    const params = {
        TableName: WHATSAPP_USERS_TABLE,
        FilterExpression: 'contains(customerIds, :customerId)',
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
export const getWhatsAppUsersUsingOrderId = async (orderId: string) => {
    const params = {
        TableName: WHATSAPP_USERS_TABLE,
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
