import * as express from "express";
import { asyncHandler } from "../../middleware/promisify";
import { checkPermission } from "../authorization";
import { Customers, Orders, Shops } from "../../repository";
import { JwtPayload } from "jsonwebtoken";
import { websocketSend } from "../../external/websocket";
import { generatePaymentId } from "../../repository/order";
import { tossApi } from "../../external";
import { sendTelegramNotification, sendWhatsappNotification } from "../../service/notify";

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

router.delete(
  "/:orderId",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const order = await Orders.getOrder(req.params.orderId);
    if (!order) {
      throw new Error(`Order ${req.params.orderId} not found`);
    }
    await Orders.deleteOrder(req.params.orderId);
    res.json({ message: "Order deleted", order });
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
  })
);

router.post("/:orderId/request-payment", asyncHandler(async (req, res) => {
  await checkPermission(req);
  const shop = await Shops.getShopByUid(req.params.shopUid);
  const order = await Orders.getOrder(req.params.orderId);
  if (!order) {
    throw new Error(`Order ${req.params.orderId} not found`);
  }

  const newPaymentId = Orders.generatePaymentId();
  order.paymentId = newPaymentId;
  const payment = {
    paymentId: newPaymentId,
    amount: req.body.amount,
    status: "requested",
    createdAt: new Date().toISOString(),
  }
  if (order.payments) {
    order.payments.unshift(payment);
  } else {
    order.payments = [payment]
  }
  await Orders.updateOrder(order.orderId, {
    paymentId: newPaymentId,
    payments: order.payments,
  });

  const message = `Payment requested for order ${order.orderId}
Pay: ${process.env.FRONTEND_URL}/guest/${shop.shopUid}/payment/${order.orderId}
  `;
  await sendTelegramNotification(order.orderId, order, message);
  await sendWhatsappNotification(order.orderId, order, message);

  // request payment
  res.json({ message: "Payment requested", order });
}));

// cancelPayment
router.post("/:orderId/cancel-payment", asyncHandler(async (req, res) => {
  await checkPermission(req);
  const shop = await Shops.getShopByUid(req.params.shopUid);
  const order = await Orders.getOrder(req.params.orderId);
  if (!order) {
    throw new Error(`Order ${req.params.orderId} not found`);
  }

  const payment = order.payments.find((p) => p.paymentId === req.body.paymentId);
  if (!payment) {
    throw new Error(`Payment ${order.paymentId} not found`);
  }

  const tossResponse = await tossApi.cancelTossPayment(payment.tossPaymentKey!, payment.amount!, "Admin canceled order");

  payment.status = "canceled";
  payment.tossPaymentResponse = tossResponse;
  await Orders.updateOrder(order.orderId, {
    payments: order.payments,
  });

  // cancel payment
  res.json({ message: "Payment canceled", order });
}));

// deletePayment
router.delete("/:orderId/payments/:paymentId", asyncHandler(async (req, res) => {
  await checkPermission(req);
  const shop = await Shops.getShopByUid(req.params.shopUid);
  const order = await Orders.getOrder(req.params.orderId);
  if (!order) {
    throw new Error(`Order ${req.params.orderId} not found`);
  }

  const payment = order.payments.find((p) => p.paymentId === req.params.paymentId);
  if (!payment) {
    throw new Error(`Payment ${req.params.paymentId} not found`);
  }

  order.payments = order.payments.filter((p) => p.paymentId !== req.params.paymentId);
  await Orders.updateOrder(order.orderId, {
    payments: order.payments,
  });

  // delete payment
  res.json({ message: "Payment deleted", order });
}));
