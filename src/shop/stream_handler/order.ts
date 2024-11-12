// const telegramDb = require('../telegram/db');
// const telegramApi = require('../telegram/bot');
// const whatsappDb = require('../twilio/db');
// const whatsappApi = require('../twilio/twilio');

import { Converter } from "aws-sdk/clients/dynamodb";
import * as telegram from "../external/telegram";
import * as twilio from "../external/twilio";
import { getTelegramUsersUsingOrderId } from "../repository/telegramWebhook";
import { findWhatsAppMessageOriginatingFrom, getWhatsAppUsersUsingOrderId } from "../repository/twilioWebhook";
import { Fcm } from "../repository";

const sendTelegramNotification = async (orderId: string, newOrder: any) => {
  const { Count: foundUserCount, Items: foundUsers } =
    await getTelegramUsersUsingOrderId(orderId);
  console.log("Existing telegram user", foundUserCount);
  for (const user of foundUsers!) {
    const telegramUserId = user.telegramUserId;
    const message = `Order ${orderId} has been changed!
- New Status : ${newOrder?.status}`;
    console.log("Sending message", message);
    await telegram.sendMessage(telegramUserId, message);
  }
};

const sendWhatsappNotification = async (orderId: string, newOrder: any) => {
  const { Count: foundUserCount, Items: foundUsers } =
    await getWhatsAppUsersUsingOrderId(orderId);
  console.log('Existing whatsapp user', foundUserCount);
  for (const user of foundUsers || []) {
    const { Items: foundMessages } = await findWhatsAppMessageOriginatingFrom(user.whatsappUserId);
    console.log('Found messages', foundMessages);
    const from = foundMessages?.at(-1)?.To;
    if (!from) {
      console.log(`No message found for user ${user.whatsappUserId}`);
      throw new Error(`No message found for user ${user.whatsappUserId}`);
    }
    const whatsappUserId = user.whatsappUserId;
    const message = `Order ${orderId} has been changed!
- New Status : ${newOrder?.status}
    `;
    console.log('Sending message', message);
    await twilio.sendMessage(from, whatsappUserId, message);
  }
};

/**
 * Dynamo DB on change event handler
 * @param {*} event
 * @param {*} context
 */
// eslint-disable-next-line no-unused-vars
export const onOrderChange = async (event: any, context: any) => {
  console.log("Order changed", event);

  for (const record of event.Records) {
    /**
     * @type {DynamoDBStreamRecord}
     */
    const streamEvent = record;
    const eventName = streamEvent.eventName;
    if (eventName == 'INSERT') {
      const shopId = streamEvent.dynamodb.NewImage.shopId.S
      const fcmTokenWithShopId = await Fcm.getFcmTokensWithShopId(shopId);
      for (const fcmToken of fcmTokenWithShopId) {
        const message = {
          notification: {
            title: 'New Order',
            body: 'You have a new order!',
          },
          token: fcmToken,
        };
        await Fcm.sendMessage(message);
      }
    } else if (eventName !== "MODIFY") {
      console.log("Skipping record", eventName);
      continue;
    }
    console.log("Processing record", JSON.stringify(record, null, 4));
    const newOrderId = streamEvent.dynamodb.NewImage.orderId.S;
    const newOrder = Converter.unmarshall(streamEvent.dynamodb.NewImage);
    console.log("Processing order", newOrderId);

    await sendTelegramNotification(newOrderId, newOrder).catch((error) => {
      console.error("Error sending telegram notification", error);
    });
    await sendWhatsappNotification(newOrderId, newOrder).catch((error) => {
      console.error("Error sending whatsapp notification", error);
    });
  }
  return event;
};
