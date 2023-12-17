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

var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10', endpoint: DYNAMODB_endpoint})

export const createOrUpdateFcmToken = async ({
    datetime,
    fcmToken,
    username
}: {
    datetime: string,
    fcmToken: string,
    username: string
}) => {
    const existing = await ddb.getItem({
        TableName: TABLE_NAME,
        Key: {
            'fcmToken': { S: fcmToken }
        }
    }).promise();

    if (existing) {
        return ddb.updateItem({
            TableName: TABLE_NAME,
            Key: {
                'fcmToken': { S: fcmToken },
                'username': { S: username },
                'datetime': { S: datetime }
            }
        })
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
