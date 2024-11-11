// const telegramDb = require('../telegram/db');
// const telegramApi = require('../telegram/bot');
// const whatsappDb = require('../twilio/db');
// const whatsappApi = require('../twilio/twilio');

import * as telegram from "../external/telegram";
import { getTelegramUsersUsingOrderId } from "../repository/telegramWebhook";

const sendTelegramNotification = async (orderId: string) => {
    const { Count: foundUserCount, Items: foundUsers } =
        await getTelegramUsersUsingOrderId(orderId);
    console.log('Existing telegram user', foundUserCount);
    for (const user of foundUsers!) {
        const telegramUserId = user.telegramUserId;
        const message = `Order ${orderId} has been changed!`;
        console.log('Sending message', message);
        await telegram.sendMessage(telegramUserId, message);
    }
};

// const sendWhatsappNotification = async (orderId: string) => {
//     const { Count: foundUserCount, Items: foundUsers } =
//         await whatsappDb.getWhatsAppUsersUsingOrderId(orderId);
//     console.log('Existing whatsapp user', foundUserCount);
//     for (const user of foundUsers) {
//         const { Items: foundMessages } = await whatsappDb.findWhatsAppMessageOriginatingFrom(user.whatsappUserId);
//         console.log('Found messages', foundMessages);
//         const from = foundMessages?.at(-1).To;
//         const whatsappUserId = user.whatsappUserId;
//         const message = `Order ${orderId} has been changed!`;
//         console.log('Sending message', message);
//         await whatsappApi.sendMessage(from, whatsappUserId, message);
//     }
// };

/**
 * Dynamo DB on change event handler
 * @param {*} event
 * @param {*} context
 */
// eslint-disable-next-line no-unused-vars
export const onOrderChange = async (event: any, context: any) => {
    console.log('Order changed', event);

    for (const record of event.Records) {
        /**
         * @type {DynamoDBStreamRecord}
         */
        const streamEvent = record;
        const eventName = streamEvent.eventName;
        if (eventName !== 'MODIFY') {
            console.log('Skipping record', eventName);
            continue;
        }
        console.log('Processing record', JSON.stringify(record, null, 4));
        const newOrderId = streamEvent.dynamodb.NewImage.orderId.S;
        console.log('Processing order', newOrderId);

        await sendTelegramNotification(newOrderId).catch((error) => {
            console.error('Error sending telegram notification', error);
        });
        // await sendWhatsappNotification(newOrderId);
    }
    return event;
};
