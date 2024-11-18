import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { Customer } from "./customer";
import { Shops } from ".";
import { Shop } from "./shop";

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.DYNAMODB_TABLE_ORDER || "order-table-dev";

interface Order {
  orderId: string;
  shopId: string;
  customerId: string;
  items: string[];
  total: number;
  createdAt: string;
  paymentId?: string;
  payments: {
    paymentId?: string;
    status?: string;
    amount?: number;
    createdAt?: string;
    updatedAt?: string;
    tossPaymentKey?: string;
    tossPaymentResponse?: any;
  }[]
}

export const generateOrderId = () => {
  return nanoid();
};

export const generatePaymentId = () => {
  return nanoid();
}

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
  shop: Shop,
  body: any
): Promise<Order> => {
  const orderId = generateOrderId();
  const total = body.items.reduce((acc: number, item: any) => {
    return acc + item.price;
  }, 0);
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
      customer,
      shop,
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

export const updateOrder = async (orderId: string, attrs: { [key: string]: any }) => {
  const updateExpressions = [];
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: string } = {};

  for (const key in attrs) {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = attrs[key];
  }

  const params = {
    TableName: ORDERS_TABLE,
    Key: {
      orderId,
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  await dynamoDbClient.send(new UpdateCommand(params));
  return getOrder(orderId);
}

export const recordPayment = async (orderId: string, newPayment: { paymentId: string, paymentKey: string, amount: number, status: string, tossResponse: any }) => {
  const order = await getOrder(orderId);

  const payment = order.payments.find((p) => p.paymentId === newPayment.paymentId);
  if (!payment) {
    throw new Error(`Payment ${newPayment.paymentId} not found`);
  }

  payment.tossPaymentKey = newPayment.paymentKey;
  payment.amount = newPayment.amount;
  payment.status = newPayment.status;
  payment.tossPaymentResponse = newPayment.tossResponse;

  // order.payments.unshift(payment);

  await updateOrder(orderId, {
    payments: order.payments,
  });
  return getOrder(orderId);
}

export const deletePayment = async (orderId: string, paymentId: string) => {
  const order = await getOrder(orderId);

  const payment = order.payments.find((p) => p.paymentId === paymentId);
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const newPayments = order.payments.filter((p) => p.paymentId !== paymentId);

  await updateOrder(orderId, {
    paymentId: newPayments.length > 0 ? newPayments[0].paymentId : null,
    payments: newPayments,
  });
  return getOrder(orderId);
}

export const deleteOrder = async (orderId: string) => {
  const params = {
    TableName: ORDERS_TABLE,
    Key: {
      orderId,
    },
  };

  await dynamoDbClient.send(new DeleteCommand(params));
};
