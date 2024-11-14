import {
  AttributeValue,
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { UserProfile } from "../cognito/api";
import { Converter } from "aws-sdk/clients/dynamodb";

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const SHOPS_TABLE = process.env.DYNAMODB_TABLE_SHOP || "shop-table-dev";
const USERSHOPS_TABLE =
  process.env.DYNAMODB_TABLE_USERSHOP || "usershop-table-dev";

export interface Shop {
  shopId: string;
  shopUid: string;
  createdAt: string;

  telegramId?: string;
  whatsappId?: string;
  useTelegram?: boolean;
  useWhatsapp?: boolean;
}

export interface UserShop {
  userId: string;
  shopId: string;
  role: string;
  shop?: Shop;
}

export const generateShopId = () => {
  return nanoid();
};

export const getAllShops = async (): Promise<Shop[]> => {
  const params = {
    TableName: SHOPS_TABLE,
    AttributesToGet: [
      "shopId",
      "shopUid",
      "createdAt",
      "telegramId",
      "useTelegram",
      "whatsappId",
      "useWhatsapp",
    ],
  };

  const { Items } = await dynamoDbClient.send(new ScanCommand(params));
  return (Items || []).map((item) => Converter.unmarshall(item)) as Shop[];
};

export const getShop = async (shopId: string): Promise<Shop> => {
  const params = {
    TableName: SHOPS_TABLE,
    Key: {
      shopId,
    },
  };

  const { Item } = await dynamoDbClient.send(new GetCommand(params));
  return Item as Shop;
};

export const createShop = async (shopUid: string): Promise<Shop> => {
  const shopId = generateShopId();
  const params = {
    TableName: SHOPS_TABLE,
    Item: {
      shopId,
      shopUid,
      createdAt: new Date().toISOString(),
    },
  };

  await dynamoDbClient.send(new PutCommand(params));
  return params.Item as Shop;
};

export const createUserShop = async (
  userId: string,
  shopId: string,
  userProfile: UserProfile,
  role: string
): Promise<UserShop> => {
  const params = {
    TableName: USERSHOPS_TABLE,
    Item: {
      userId,
      shopId,
      role,
      username: userProfile.username,
    },
  };

  await dynamoDbClient.send(new PutCommand(params));
  return params.Item as UserShop;
};

export const getShopByUid = async (shopUid: string): Promise<Shop> => {
  // shopUid is not primary key, so we need to use query

  const params = {
    TableName: SHOPS_TABLE,
    IndexName: "shopUid-index",
    KeyConditionExpression: "shopUid = :shopUid",
    ExpressionAttributeValues: {
      ":shopUid": shopUid,
    },
  };

  const { Items, Count } = await dynamoDbClient.send(new QueryCommand(params));
  return Items?.[0] as Shop;
  // if (Count === 0 || !Items || Items?.length === 0) {
  //   throw new Error(`Shop with shopUid ${shopUid} not found`);
  // }
  // return Converter.unmarshall(Items[0]) as Shop;
};

export const getShopsForUser = async (
  userId: string
): Promise<
  {
    shopId: string;
    shopUid: string;
    role: string;
    shop: Shop;
  }[]
> => {
  const params = {
    TableName: USERSHOPS_TABLE,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  const { Items } = await dynamoDbClient.send(new QueryCommand(params));
  const shopIds = Items?.map((item) => (item as UserShop).shopId) || [];
  return Promise.all(
    shopIds.map(async (shopId) => {
      const shop = await getShop(shopId);
      const userShop = Items?.find(
        (item) => (item as UserShop).shopId === shopId
      );
      return {
        shopId,
        shopUid: shop?.shopUid as string,
        role: userShop?.role as string,
        shop,
      };
    })
  );
};

// userId is key schema. so querying is not possible
// export const getShopUserForShop = async (
//   shopId: string
// ): Promise<
//   {
//     userId: string;
//     role: string;
//     shop: Shop;
//   }[] | null> => {
//   const params = {
//     TableName: USERSHOPS_TABLE,
//     KeyConditionExpression: "shopId = :shopId",
//     ExpressionAttributeValues: {
//       ":shopId": shopId,
//     },
//   };

//   const { Items } = await dynamoDbClient.send(new QueryCommand(params));
//   if (!Items || Items.length === 0) {
//     return null;
//   }

//   const userIds = Items.map((item) => (item as UserShop).userId);
//   return Promise.all(
//     userIds.map(async (userId) => {
//       const userShop = Items.find((item) => (item as UserShop).userId === userId);
//       const shop = await getShop(shopId);
//       return {
//         userId,
//         role: userShop?.role as string,
//         shop,
//       };
//     })
//   );
// }

export const getUsersForShop = async (shopId: string): Promise<UserShop[]> => {
  const params = {
    TableName: USERSHOPS_TABLE,
    AttributesToGet: ["userId", "shopId", "role"],
  };

  const { Items } = await dynamoDbClient.send(new ScanCommand(params));
  return Items?.map((item) => Converter.unmarshall(item)).filter((item) => (item as UserShop).shopId === shopId) as UserShop[];
}

export const updateShop = async (
  shopUid: string,
  kv: { [key: string]: string }
): Promise<Shop> => {
  const shop = await getShopByUid(shopUid);
  if (!shop) {
    throw new Error(`Shop with shopUid ${shopUid} not found`);
  }

  let updates = [];
  let attrnames: { [key: string]: string } = {};
  let attrvalues: { [key: string]: string | number | boolean } = {};

  for (const key in kv) {
    updates.push(`#${key} = :${key}`);
    attrnames[`#${key}`] = key;
    attrvalues[`:${key}`] = kv[key];
  }

  const params = {
    TableName: SHOPS_TABLE,
    Key: {
      shopId: shop.shopId,
    },
    UpdateExpression: `set ${updates.join(", ")}`,
    ExpressionAttributeNames: attrnames,
    ExpressionAttributeValues: attrvalues,
  };

  await dynamoDbClient.send(new UpdateCommand(params));
  const newShop = await getShop(shop.shopId);
  return newShop as Shop;
};

export const isAuthorized = async (
  userId: string,
  shopId: string
): Promise<boolean> => {
  const shop = await getShop(shopId);
  if (!shop) {
    throw new Error(`Shop with shopId ${shopId} not found`);
  }
  const params = {
    TableName: USERSHOPS_TABLE,
    Key: {
      userId,
      shopId: shop.shopId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    return !!Item;
  } catch (error) {
    return false;
  }
};
