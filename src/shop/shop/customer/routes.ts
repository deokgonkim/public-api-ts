import * as express from "express";
import { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../../middleware/promisify";
import { Customers, Shops } from "../../repository";
import { checkPermission } from "../authorization";
export const router = express.Router({ mergeParams: true });

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const shop = await Shops.getShopByUid(req.params.shopUid);
    const customers = await Customers.getCustomers(shop.shopId);
    res.json(customers);
  })
);

router.get(
  "/:customerId",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const customer = await Customers.getCustomer(req.params.customerId);
    res.json(customer);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const login = req.user as JwtPayload;
    const shop = await Shops.getShopByUid(req.params.shopUid);
    await checkPermission(req);

    const name = req.body.name;
    const phone = req.body.phone;
    const customer = await Customers.createCustomer(shop.shopId, name, phone);

    res.json(customer);
  })
);

router.delete(
  "/:customerId",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const shop = await Shops.getShopByUid(req.params.shopUid);
    const customer = await Customers.getCustomer(req.params.customerId);
    await Customers.deleteCustomer(customer.customerId);
    res.json({ message: "Customer deleted" });
  })
);
