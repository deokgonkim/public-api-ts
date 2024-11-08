import express from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { getUser } from '../cognito/api';
import * as Customers from '../repository/customer';
import * as Orders from '../repository/order';
import * as Shops from '../repository/shop';

export const router = express.Router();

router.get('/', async (req, res) => {
    res.json({ message: 'Hello from shop!' });
});

router.get('/profile', async (req, res) => {
    const login = req.user as JwtPayload;
    const user = await getUser(login.username!);
    console.log('user', user);
    res.json({
        ...user,
    });
});

router.get('/:shopUid/orders', async (req, res) => {
    const shopUid = req.params.shopUid;

    const orders = await Orders.getOrdersForShop(shopUid);
    console.log('orders', orders);
    res.json(orders);
});

router.post('/:shopUid/orders', async (req, res) => {
    const shopUid = req.params.shopUid;
    const body = req.body;
    const name = body.customer?.name;
    const phone = body.customer?.phone;

    const shop = await Shops.getShopByUid(shopUid);
    const customer = await Customers.getCustomerUsingNamePhone(shop.shopId, name, phone);
    let customerId = customer?.customerId;
    if (!customer) {
        customerId = await Customers.createCustomer(shop.shopId, name, phone);
        console.log('customerId', customerId);
    }

    const orderUid = await Orders.createOrder(shop.shopId, customerId, body);
    console.log('orderUid', orderUid);
    res.json({ orderUid });
});
