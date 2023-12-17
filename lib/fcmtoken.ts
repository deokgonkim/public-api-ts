import * as AWS from 'aws-sdk'
import { PutItemInputAttributeMap, AttributeMap, Key } from 'aws-sdk/clients/dynamodb';

const STAGE = process.env.STAGE || 'dev'
const REGION = process.env.AWS_REGION || 'ap-northeast-2'

// TODO: AppId를 자동으로 검출할 방법은?
const TABLE_NAME = `public-api-ts-FcmTokens-${STAGE}`

// Set the region 
AWS.config.update({region: REGION});

// Create the DynamoDB service object
const DYNAMODB_endpoint = process.env.LOCAL ? new AWS.Endpoint('http://localhost:8000') : undefined
console.log(`Dynamo Endpoint : ${DYNAMODB_endpoint}`)

var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10', endpoint: DYNAMODB_endpoint});

export const getFcmToken = async (fcmToken: string) => {
    const params: AWS.DynamoDB.Types.QueryInput = {
        KeyConditionExpression: "fcmToken = :fcmToken",
        ExpressionAttributeValues: {
          ":fcmToken": {S: fcmToken},
        },
        TableName: TABLE_NAME
    };
    return ddb.query(params).promise();
}

export const createOrUpdateFcmToken = async ({
    datetime,
    fcmToken,
    username
}: {
    datetime: string,
    fcmToken: string,
    username: string
}) => {
    const params: AWS.DynamoDB.Types.QueryInput = {
        KeyConditionExpression: "fcmToken = :fcmToken",
        ExpressionAttributeValues: {
          ":fcmToken": {S: fcmToken},
        },
        TableName: TABLE_NAME
    };
       
    const existing = await ddb.query(params).promise();

    if (existing && existing.Items!.length > 0) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                fcmToken: { S: fcmToken },
            },
            UpdateExpression: "set username = :username, datetime = :datetime",
            ExpressionAttributeValues: {
                ":username": { S: username },
                ":datetime": { S: datetime }
            },
            ReturnValues: "UPDATED_NEW",
        };
        return ddb.updateItem(params);
    } else {
        const item: PutItemInputAttributeMap = {
            'fcmToken': { S: fcmToken },
            'username': { S: username },
            'datetime': { S: datetime }
        }
        return ddb.putItem({
            TableName: TABLE_NAME,
            Item: item
        }).promise()
    }
}
