import express from 'express';
import { asyncHandler } from '../../middleware/promisify';
import { getWhatsAppUserById, recordWhatsapp, recordWhatsAppUser } from '../../repository/twilioWebhook';
import { getOrder } from '../../repository/order';

/*
 * Telegram WebHook handlers
 */

export const router = express.Router({ mergeParams: true });

/**
 * Twilio supports both WhatsApp and SMS messaging.
 */

router.get('/', async (req, res) => {
    res.json({ message: 'Hello from WhatsApp webhook!' });
});

/**
 * For SMS
 */
router.post('/sms', async (req, res) => {
    console.log('Received SMS Message', JSON.stringify(req.body, null, 4));

    res.json({ message: 'Message received!' });
});

/**
 * For WhatsApp
 */

/**
 * When a message comes in
 * to receive client message
 * 
 * default : https://timberwolf-mastiff-9776.twil.io/demo-reply
 */
router.post('/whatsapp', async (req, res) => {
    console.log('Received WhatsApp Message', JSON.stringify(req.body, null, 4));

    await recordWhatsapp(req.body);

    /**
     * @type {WhatsAppMessage}
     */
    const whatsappMessage = req.body;

    const whatsappUserId = whatsappMessage.From;
    console.log('WhatsApp UserId:', whatsappUserId);
    const whatsappUser = await getWhatsAppUserById(whatsappUserId);
    if (whatsappUser) {
        console.log('WhatsApp User:', whatsappUser);
    } else {
        await recordWhatsAppUser({
            whatsappUserId: whatsappUserId,
            ProfileName: whatsappMessage.ProfileName,
        });
    }

    if (whatsappMessage.Body.startsWith('My Order')) {
        // Message format: My Order is <orderId>
        const regexp = /My Order is (\w+)/;
        const [customerId, orderId] = whatsappMessage.Body.match(regexp)[1]?.split(',');
        console.log('Order ID:', orderId);
        const order = await getOrder(orderId);
        if (order) {
            // const customerId = order.customerId;
            await recordWhatsAppUser({
                whatsappUserId: whatsappMessage.From,
                ProfileName: whatsappMessage.ProfileName,
            }, customerId, orderId);
        }
    }

    res.json({ message: 'Message received!' });
});

/**
 * Status callback URL
 * 
 * to receive status of delivery that we sent from our side
 * 
 * default : none
 */
router.post('/whatsapp/status-callback', asyncHandler(async (req, res) => {
    console.log('received status callback', JSON.stringify(req.body, null, 4));

    res.json({ message: 'Status callback received!' });
}));
