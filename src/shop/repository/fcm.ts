import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Converter } from "aws-sdk/clients/dynamodb";

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const FCM_TOKEN_TABLE =
  process.env.DYNAMODB_TABLE_FCM_TOKEN || "fcm-tokens-table-dev";
const FCM_SENT_TABLE =
  process.env.DYNAMODB_TABLE_FCM_SENT || "fcm-sent-table-dev";

export interface FcmToken {
  fcmToken?: string;
  userId?: string;
  shopIds?: string[];
  createdAt?: string;
}

export const getFcmToken = async (fcmToken: string): Promise<FcmToken> => {
  const params = {
    TableName: FCM_TOKEN_TABLE,
    Key: {
      fcmToken,
    },
  };

  const { Item } = await dynamoDbClient.send(new GetCommand(params));
  return Item as FcmToken;
};

export const getFcmTokensWithShopId = async (
  shopId: string
): Promise<FcmToken[]> => {
  const params = {
    TableName: FCM_TOKEN_TABLE,
    FilterExpression: "contains(shopIds, :shopId) AND attribute_not_exists(lastErrorMessage)",
    ExpressionAttributeValues: {
      ":shopId": { S: shopId },
    },
  };

  const { Items } = await dynamoDbClient.send(new ScanCommand(params));
  return (Items || []).map((item) => Converter.unmarshall(item)) as FcmToken[];
};

export const registerFcmToken = async (
  fcmToken: string,
  userId?: string,
  shopIds?: string[]
): Promise<FcmToken> => {
  const params = {
    TableName: FCM_TOKEN_TABLE,
    Item: {
      fcmToken,
      userId,
      shopIds,
      createdAt: new Date().toISOString(),
    },
  };

  await dynamoDbClient.send(new PutCommand(params));
  return getFcmToken(fcmToken);
};

export const deregisterFcmToken = async (fcmToken: string) => {
  const params = {
    TableName: FCM_TOKEN_TABLE,
    Key: {
      fcmToken,
    },
  };

  await dynamoDbClient.send(new DeleteCommand(params));
};

export const updateFcmToken = async (
  fcmToken: string,
  response: {
    [key: string]: any;
  }
) => {
  const updateExpressions = [];
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: string } = {};

  for (const key in response) {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = response[key];
  }

  const params = {
    TableName: FCM_TOKEN_TABLE,
    Key: {
      fcmToken,
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  await dynamoDbClient.send(new UpdateCommand(params));
};

export const recordFcmSent = async (
  messageId: string,
  fcmToken: string,
  payload: string
) => {
  const params = {
    TableName: FCM_SENT_TABLE,
    Item: {
      messageId,
      fcmToken,
      payload,
      createdAt: new Date().toISOString(),
    },
  };

  await dynamoDbClient.send(new PutCommand(params));
};
