import express from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { asyncHandler } from '../middleware/promisify';
import { getUserProfile } from '../cognito/api';
import * as Shops from '../repository/shop';
import { router as customerRouter } from './customer/routes';
import { router as orderRouter } from './order/routes';

export const router = express.Router();

router.get('/', async (req, res) => {
    res.json({ message: 'Hello from shop!' });
});

router.get('/profile', asyncHandler(async (req, res) => {
    const login = req.user as JwtPayload;
    const userProfile = await getUserProfile(login.username!);
    userProfile.userShops = await Shops.getShopsForUser(login.sub!);
    if (userProfile.userShops?.length == 0) {
        let shop = await Shops.getShopByUid(userProfile.username);
        if (!shop) {
            shop = await Shops.createShop(userProfile.username);
        }
        await Shops.createUserShop(login.sub!, shop.shopId, userProfile, 'OWNER');
        userProfile.userShops = await Shops.getShopsForUser(login.sub!);
    }
    console.log('profile', userProfile);
    res.json({
        ...userProfile,
    });
}));

router.use('/:shopUid/customers', customerRouter);
router.use('/:shopUid/orders', orderRouter);