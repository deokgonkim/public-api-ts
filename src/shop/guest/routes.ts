import express from "express";
import { asyncHandler } from "../middleware/promisify";
import { Customers, Orders, Shops } from "../repository";
import { ChatMessage, MessageType } from "../../websocket/types";
import { websocketSend } from "../external/websocket";
import { JwtPayload } from "jsonwebtoken";

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

    const user = req.user as JwtPayload;

    await websocketSend(user.sub!, order);

    res.json(order);
  })
);
