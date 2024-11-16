import express from "express";
import { asyncHandler } from "../../middleware/promisify";
import {
  getTelegramUserById,
  recordTelegramUser,
  recordTelegramWebHook,
} from "../../repository/telegramWebhook";
import { sendMessage } from "../../external/telegram";
import { TelegramUpdate } from "../../repository/telegram.schema";
import { getOrder } from "../../repository/order";
import { getShop } from "../../repository/shop";
/*
 * Telegram WebHook handlers
 */

export const router = express.Router({ mergeParams: true });

router.post(
  "/",
  asyncHandler(async (req, res) => {
    console.log("received request", JSON.stringify(req.body, null, 4));

    /**
     * @type {TelegramUpdate}
     */
    const telegramUpdate: TelegramUpdate = req.body;
    await recordTelegramWebHook(telegramUpdate);

    // const telegramUserId = telegramUpdate?.message?.from?.id;
    const entities = telegramUpdate?.message?.entities;
    if (entities) {
      for (const entity of entities) {
        if (entity.type === "bot_command") {
          const command = telegramUpdate.message.text.slice(
            entity.offset,
            entity.offset + entity.length
          );
          console.log("Command:", command);
          if (command == "/start") {
            // retrieve userId and orderId from the command
            // the value is base64 encoded
            const decodedValue = Buffer.from(
              telegramUpdate.message.text.slice(
                entity.offset + entity.length + 1
              ),
              "base64"
            ).toString();
            const value = decodedValue?.split(",");
            const customerId = value?.[0];
            const orderId = value?.[1];
            console.log("customerId:", customerId);
            console.log("orderId:", orderId);
            if (customerId && orderId) {
              await recordTelegramUser(
                telegramUpdate.message.from,
                customerId,
                orderId
              );
            }
          }
        }
      }
    }

    const telegramUser = await getTelegramUserById(
      telegramUpdate?.message?.from?.id
    );
    const associatedLastOrderId = telegramUser?.orderIds?.at(-1);
    const order = await getOrder(associatedLastOrderId);
    const shop = order ? await getShop(order?.shopId) : null;

    const mentioningBoss =
      telegramUpdate.message?.text?.startsWith("사장님") ||
      telegramUpdate.message?.text?.startsWith("Boss");

    if (mentioningBoss && order && shop) {
      await sendMessage(
        telegramUpdate.message.chat.id,
        `Here, You can contact boss\nhttps://t.me/${shop.telegramId}`
      );
    } else {
      await sendMessage(
        telegramUpdate.message.chat.id,
        "When something happens, I will notify you!"
      );
    }

    // console.log(message);
    res.json({ message: "Message received!" });
  })
);
