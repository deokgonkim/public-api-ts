// const telegramDb = require('../telegram/db');
// const telegramApi = require('../telegram/bot');
// const whatsappDb = require('../twilio/db');
// const whatsappApi = require('../twilio/twilio');

import { Converter } from "aws-sdk/clients/dynamodb";
import { Fcm } from "../repository";
import { fcmApi } from "../external";
import { sendTelegramNotification, sendWhatsappNotification } from "../service/notify";

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
    console.log("record", JSON.stringify(record));
    if (eventName == "INSERT") {
      const shopId = streamEvent.dynamodb.NewImage.shopId.S;
      const shopUid = streamEvent.dynamodb.NewImage.shopUid.S;
      const fcmTokenWithShopId = await Fcm.getFcmTokensWithShopId(shopId);
      for (const fcmToken of fcmTokenWithShopId) {
        // const message = {
        //   notification: {
        //     title: 'New Order',
        //     body: 'You have a new order!',
        //   },
        //   token: fcmToken,
        // };
        await fcmApi.sendMessage(
          fcmToken?.fcmToken!,
          `You have a new order ${streamEvent.dynamodb.NewImage.orderId.S}`,
          {
            link: `/shop/${shopUid}/orders/${streamEvent.dynamodb.NewImage.orderId.S}`,
          }
        );
      }
    } else if (eventName !== "MODIFY") {
      console.log("Skipping record", eventName);
      continue;
    }
    // console.log("Processing record", JSON.stringify(record, null, 4));
    const newOrderId = streamEvent.dynamodb.NewImage.orderId.S;
    const newOrder = Converter.unmarshall(streamEvent.dynamodb.NewImage);
    const oldOrder = Converter.unmarshall(streamEvent.dynamodb.OldImage);
    console.log("Processing order", newOrderId);

    if (newOrder.status === oldOrder.status) {
      console.log("Skipping order same status", newOrderId);
      continue;
    }

    await sendTelegramNotification(newOrderId, newOrder).catch((error) => {
      console.error("Error sending telegram notification", error);
    });
    await sendWhatsappNotification(newOrderId, newOrder).catch((error) => {
      console.error("Error sending whatsapp notification", error);
    });
  }
  return event;
};
