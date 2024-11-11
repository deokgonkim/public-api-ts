import express from 'express';
import { asyncHandler } from '../../middleware/promisify';
import { recordTelegramUser, recordTelegramWebHook } from '../../repository/telegramWebhook';
import { sendMessage } from '../../external/telegram';
/*
 * Telegram WebHook handlers
 */

export const router = express.Router({ mergeParams: true });

router.post('/', asyncHandler(async (req, res) => {
    console.log('received request', JSON.stringify(req.body, null, 4));

    /**
     * @type {TelegramUpdate}
     */
    const telegramUpdate = req.body;
    await recordTelegramWebHook(telegramUpdate);

    // const telegramUserId = telegramUpdate?.message?.from?.id;
    const entities = telegramUpdate?.message?.entities;
    if (entities) {
        for (const entity of entities) {
            if (entity.type === 'bot_command') {
                const command = telegramUpdate.message.text.slice(entity.offset, entity.offset + entity.length);
                console.log('Command:', command);
                if (command == '/start') {
                    // retrieve userId and orderId from the command
                    // the value is base64 encoded
                    const decodedValue = Buffer.from(telegramUpdate.message.text.slice(entity.offset + entity.length + 1), 'base64').toString();
                    const value = decodedValue?.split(',');
                    const customerId = value?.[0];
                    const orderId = value?.[1];
                    console.log('customerId:', customerId);
                    console.log('orderId:', orderId);
                    if (customerId && orderId) {
                        await recordTelegramUser(telegramUpdate.message.from, customerId, orderId);
                    }
                }
            }
        }
    }

    await sendMessage(telegramUpdate.message.chat.id, 'When something happens, I will notify you!');

    // console.log(message);
    res.json({ message: 'Message received!' });
}));
