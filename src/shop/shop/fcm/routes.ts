import * as express from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { asyncHandler } from '../../middleware/promisify';
import { Fcm } from '../../repository';
import { checkPermission } from '../authorization';
import { fcmApi } from '../../external';
export const router = express.Router({ mergeParams: true });

router.get('/', asyncHandler(async (req, res) => {
    // await checkPermission(req);
    // const shop = await Shops.getShopByUid(req.params.shopUid);
    // const customers = await Customers.getCustomers(shop.shopId);
    // res.json(customers);
    res.json({ message: 'Hello from fcm!' });
}));

router.post('/register', asyncHandler(async (req, res) => {
    const fcmTokenString = req.body.fcmToken;
    const fcmToken = await Fcm.registerFcmToken(fcmTokenString);
    res.json(fcmToken);
}));

router.post('/deregister', asyncHandler(async (req, res) => {
    await Fcm.deregisterFcmToken(req.body.fcmToken);
    res.json({ message: 'FcmToken deleted' });
}));

router.post('/send', asyncHandler(async (req, res) => {
    const fcmTokenString = req.body.fcmToken;
    const message = req.body.message;
    await fcmApi.sendMessage(fcmTokenString, message);
    res.json({ message: 'Message sent' });
}));
