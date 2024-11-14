import { Shops } from ".";

describe('test shop repository', () => {
    it('test usershop', async () => {
        const shopUid = 'dgkim';
        const shop = await Shops.getShopByUid(shopUid);
        console.log('shop', shop);

        const userShops = await Shops.getUsersForShop(shop.shopId);
        console.log('userShops', userShops);
    }, 30000);
});