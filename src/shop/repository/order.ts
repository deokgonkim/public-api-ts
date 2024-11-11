import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { Customer } from "./customer";
import { Shops } from ".";

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.DYNAMODB_TABLE_ORDER || "order-table-dev";

interface Order {
  orderId: string;
  shopId: string;
  items: string[];
  total: number;
  createdAt: string;
}

export const generateOrderId = () => {
  return nanoid();
};

export const getOrder = async (orderId: string): Promise<Order> => {
  const params = {
    TableName: ORDERS_TABLE,
    Key: {
      orderId,
    },
  };

  const { Item } = await dynamoDbClient.send(new GetCommand(params));
  return Item as Order;
};

export const getOrdersForShop = async (shopId: string): Promise<Order[]> => {
  const params = {
    TableName: ORDERS_TABLE,
    IndexName: "shopId-createdAt-index",
    KeyConditionExpression: "shopId = :shopId",
    ExpressionAttributeValues: {
      ":shopId": shopId,
    },
    ScanIndexForward: true, // false to sort in descending order, true for ascending
  };

  const { Items } = await dynamoDbClient.send(new QueryCommand(params));
  return Items as Order[];
};

export const createOrder = async (
  shopId: string,
  customer: Customer,
  body: any
): Promise<Order> => {
  const orderId = generateOrderId();
  const total = body.items.reduce((acc: number, item: any) => {
    return acc + item.price;
  }, 0);
  const shop = await Shops.getShop(shopId);

  const params = {
    TableName: ORDERS_TABLE,
    Item: {
      orderId,
      shopId,
      shopUid: shop.shopUid,
      customerId: customer.customerId,
      items: body.items,
      total,
      status: "created",
      createdAt: new Date().toISOString(),
      customer: customer,
    },
  };

  await dynamoDbClient.send(new PutCommand(params));
  const createdItem = await getOrder(orderId);
  return createdItem;
};

export const processOrder = async (orderId: string, status: string) => {
  const order = await getOrder(orderId);

  const params = {
    TableName: ORDERS_TABLE,
    Key: {
      orderId,
    },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": status,
    },
  };

  await dynamoDbClient.send(new UpdateCommand(params));
  const newOrder = await getOrder(orderId);
  return newOrder;
};
