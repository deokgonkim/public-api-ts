import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Shops } from "../repository";


/**
 * Check the user can access the shop
 * userId from req.user.sub
 * shopUid from req.params.shopUid
 * @param req
 */
export const checkPermission = async (req: Request) => {
    const login = req.user as JwtPayload;
    const shop = await Shops.getShopByUid(req.params.shopUid);
    if (!shop) {
        throw new Error(`Shop ${req.params.shopUid} not found`);
    }
    if (!(await Shops.isAuthorized(login.sub!, shop?.shopId))) {
        throw new Error('Unauthorized');
    }
}
