import { telegramApi, twilioApi } from "../external";
import { getTelegramUsersUsingOrderId } from "../repository/telegramWebhook";
import { findWhatsAppMessageOriginatingFrom, getWhatsAppUsersUsingOrderId } from "../repository/twilioWebhook";

export const sendTelegramNotification = async (orderId: string, newOrder: any, message?: string) => {
    const { Count: foundUserCount, Items: foundUsers } =
        await getTelegramUsersUsingOrderId(orderId);
    console.log("Existing telegram user", foundUserCount);
    for (const user of foundUsers!) {
        const telegramUserId = user.telegramUserId;
        const messageToSend = message ?? `Order ${orderId} has been changed!
- New Status : ${newOrder?.status}`;
        console.log("Sending message", messageToSend);
        await telegramApi.sendMessage(telegramUserId, messageToSend);
    }
};

export const sendWhatsappNotification = async (orderId: string, newOrder: any, message?: string) => {
    const { Count: foundUserCount, Items: foundUsers } =
        await getWhatsAppUsersUsingOrderId(orderId);
    console.log("Existing whatsapp user", foundUserCount);
    for (const user of foundUsers || []) {
        const { Items: foundMessages } = await findWhatsAppMessageOriginatingFrom(
            user.whatsappUserId
        );
        console.log("Found messages", foundMessages);
        const from = foundMessages?.at(-1)?.To;
        if (!from) {
            console.log(`No message found for user ${user.whatsappUserId}`);
            throw new Error(`No message found for user ${user.whatsappUserId}`);
        }
        const whatsappUserId = user.whatsappUserId;
        const messageToSend = message ?? `Order ${orderId} has been changed!
- New Status : ${newOrder?.status}
      `;
        console.log("Sending message", messageToSend);
        await twilioApi.sendMessage(from, whatsappUserId, messageToSend);
    }
};