import * as express from "express";
import { asyncHandler } from "../../middleware/promisify";
import { checkPermission } from "../authorization";
import { Customers, Orders, Shops } from "../../repository";
import { JwtPayload } from "jsonwebtoken";
import { websocketSend } from "../../external/websocket";

export const router = express.Router({ mergeParams: true });

/*
 * Orders handler
 * BASE_PATH : /shop/:shopUid/orders
 */

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const login = req.user as JwtPayload;
    const shopUid = req.params.shopUid;
    const shop = await Shops.getShopByUid(shopUid);
    if (!(await Shops.isAuthorized(login.sub!, shop.shopId))) {
      throw new Error("Unauthorized");
    }

    const orders = await Orders.getOrdersForShop(shop.shopId);
    console.log("orders", orders);
    res.json(orders);
  })
);

router.post(
  "/",
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
    res.json(order);
  })
);

router.get(
  "/:orderId",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const shop = await Shops.getShopByUid(req.params.shopUid);
    const order = await Orders.getOrder(req.params.orderId);
    if (!order) {
      throw new Error(`Order ${req.params.orderId} not found`);
    }
    res.json(order);
  })
);

router.patch(
  "/:orderId",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const shopUid = req.params.shopUid;
    const orderId = req.params.orderId;
    const shop = await Shops.getShopByUid(shopUid);
    const order = await Orders.getOrder(orderId);
    const action = req.body?.action;
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    switch (action.toLowerCase()) {
      case "confirm":
        await Orders.processOrder(orderId, "confirmed");
        break;
      case "cancel":
        await Orders.processOrder(orderId, "canceled");
        break;
      case "complete":
        await Orders.processOrder(orderId, "completed");
        break;
      default:
        throw new Error(`Invalid action ${action}`);
    }
    const newOrder = await Orders.getOrder(orderId);
    res.json({ message: "Order processed", order: newOrder });
  })
);

// print
router.post(
  "/:orderId/print",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const shop = await Shops.getShopByUid(req.params.shopUid);
    const order = await Orders.getOrder(req.params.orderId);
    if (!order) {
      throw new Error(`Order ${req.params.orderId} not found`);
    }

    const userShops = await Shops.getUsersForShop(shop.shopId);

    for (const userShop of userShops!) {
      await websocketSend(userShop.userId, order);
    }

    // print order
    res.json({ message: "Order printed", order });
  }),
)