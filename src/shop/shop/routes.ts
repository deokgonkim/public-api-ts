import express from "express";
import { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../middleware/promisify";
import { getUserProfile } from "../cognito/api";
import * as Shops from "../repository/shop";
import { router as customerRouter } from "./customer/routes";
import { router as orderRouter } from "./order/routes";
import { checkPermission } from "./authorization";
import { Fcm } from "../repository";

export const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ message: "Hello from shop!" });
});

router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const login = req.user as JwtPayload;
    const userProfile = await getUserProfile(login.username!);
    userProfile.userShops = await Shops.getShopsForUser(login.sub!);
    if (userProfile.userShops?.length == 0) {
      let shop = await Shops.getShopByUid(userProfile.username);
      if (!shop) {
        shop = await Shops.createShop(userProfile.username);
      }
      await Shops.createUserShop(login.sub!, shop.shopId, userProfile, "OWNER");
      userProfile.userShops = await Shops.getShopsForUser(login.sub!);
    }
    console.log("profile", userProfile);
    res.json({
      ...userProfile,
    });
  })
);

router.get(
  "/my-shops",
  asyncHandler(async (req, res) => {
    const login = req.user as JwtPayload;
    const userShops = await Shops.getShopsForUser(login.sub!);
    res.json(userShops);
  })
);

router.get(
  "/:shopUid",
  asyncHandler(async (req, res) => {
    const shop = await Shops.getShopByUid(req.params.shopUid);
    res.json(shop);
  })
);

router.patch(
  "/:shopUid",
  asyncHandler(async (req, res) => {
    await checkPermission(req);
    const allowedKeys = [
      "shopUid",
      "shopName",
      "telegramId",
      "whatsappId",
      "useTelegram",
      "useWhatsapp",
      "description"
    ];
    const updates: { [key: string]: any } = {};
    for (const key in req.body) {
      if (allowedKeys.includes(key)) {
        updates[key] = req.body[key];
      }
    }
    const shop = await Shops.updateShop(req.params.shopUid, updates);
    res.json(shop);
  })
);

// 이것은, fcm/routes.ts에 등록된 것과는 별도의 API이다.
// 로그인한 사용자에 대해서, 사용자 ID를 등록한다.
router.post(
  "/fcm/register",
  asyncHandler(async (req, res) => {
    const login = req.user as JwtPayload;
    const fcmTokenString = req.body.fcmToken;
    const userShops = await Shops.getShopsForUser(login.sub!);
    const shopIds = userShops.map((userShop) => userShop.shopId);
    const fcmToken = await Fcm.registerFcmToken(
      fcmTokenString,
      login.sub!,
      shopIds
    );
    res.json(fcmToken);
  })
);

router.use("/:shopUid/customers", customerRouter);
router.use("/:shopUid/orders", orderRouter);
