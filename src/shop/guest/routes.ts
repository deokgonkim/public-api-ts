import express from "express";
import { asyncHandler } from "../middleware/promisify";
import { Customers, Orders, Shops } from "../repository";
import { ChatMessage, MessageType } from "../../websocket/types";
import { websocketSend } from "../external/websocket";
import { JwtPayload } from "jsonwebtoken";
import { tossApi } from "../external";

export const router = express.Router({ mergeParams: true });

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const shops = await Shops.getAllShops();
    res.json(shops);
  })
);

router.get(
  "/:shopUid",
  asyncHandler(async (req, res) => {
    const shop = await Shops.getShopByUid(req.params.shopUid);
    if (!shop) {
      throw new Error(`Shop ${req.params.shopUid} not found`);
    }
    res.json(shop);
  })
);

router.post(
  "/:shopUid/orders",
  asyncHandler(async (req, res) => {
    const shopUid = req.params.shopUid;
    const body = req.body;
    const name = body.customer?.name;
    const phone = body.customer?.phone;

    const shop = await Shops.getShopByUid(shopUid);
    let customer = await Customers.getCustomerUsingNamePhone(
      shop.shopId,
      name,
      phone
    );
    if (!customer) {
      customer = await Customers.createCustomer(shop.shopId, name, phone);
      console.log("customerId", customer.customerId);
    }

    const order = await Orders.createOrder(shop.shopId, customer, shop, body);
    console.log("orderId", order.orderId);

    // const userShops = await Shops.getUsersForShop(shop.shopId);

    // for (const userShop of userShops!) {
    //   await websocketSend(userShop.userId, order);
    // }

    res.json(order);
  })
);

router.get("/:shopUid/orders/:orderId", asyncHandler(async (req, res) => {
  const order = await Orders.getOrder(req.params.orderId);
  if (!order) {
    throw new Error(`Order ${req.params.orderId} not found`);
  }
  res.json(order);
}));

router.post('/:shopUid/orders/:orderId/payment', asyncHandler(async (req, res) => {
  const order = await Orders.getOrder(req.params.orderId);
  if (!order) {
    throw new Error(`Order ${req.params.orderId} not found`);
  }

  const tossResponse = await tossApi.processTossPayment(req.body.paymentId, req.body.amount, req.body.paymentKey);

  const newOrder = await Orders.recordPayment(order.orderId, {
    paymentId: req.body.paymentId,
    paymentKey: req.body.paymentKey,
    amount: req.body.amount,
    status: tossResponse?.status,
    tossResponse
  });
  res.json(newOrder);
}));