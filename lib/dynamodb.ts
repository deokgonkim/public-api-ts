import * as AWS from 'aws-sdk'
import { PutItemInputAttributeMap, AttributeMap, Key } from 'aws-sdk/clients/dynamodb';

const STAGE = process.env.STAGE || 'dev'
const REGION = process.env.AWS_REGION || 'ap-northeast-2'

// TODO: AppId를 자동으로 검출할 방법은?
const TABLE_NAME = `public-api-ts-TemperatureTable-${STAGE}`

// Set the region 
AWS.config.update({region: REGION});

// Create the DynamoDB service object
const DYNAMODB_endpoint = process.env.LOCAL ? new AWS.Endpoint('http://localhost:8000') : undefined
console.log(`Dynamo Endpoint : ${DYNAMODB_endpoint}`)

var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10', endpoint: DYNAMODB_endpoint})

interface TemperatureResponse {
    temperature: Number
    createdAt: String
}

/**
 * 
 * @returns {
 *  TableNames?: TableName[]
 * }
 */
const listTables = async () => {
    const tables = await ddb.listTables().promise()
    console.log(tables)
    return tables
}

/**
 * 
 * @param datetime
 * @returns
 */
const getTemperatureAt = async (datetime: string) => {
    const result = await ddb.getItem({
        TableName: TABLE_NAME,
        Key: {
            'datetime': { S: datetime }
        }
    }).promise()
    return result
}

const getAllTemperatures = async (dt: string, pageSize: number, lek?: Key) => {
    if (lek) {
        console.log(`Next scan for ${dt} and ${lek.datetime}`)
        const result = await ddb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(#dt,:datetime)',
            ExpressionAttributeNames: {"#dt": "datetime"},
            ExpressionAttributeValues: {":datetime": {"S": `${dt}`}},
            Limit: pageSize,
            ExclusiveStartKey: lek
        }).promise()
        return result
    } else {
        console.log(`First scan for ${dt}`)
        const result = await ddb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(#dt,:datetime)',
            ExpressionAttributeNames: {"#dt": "datetime"},
            ExpressionAttributeValues: {":datetime": {"S": `${dt}`}},
            Limit: pageSize // 안 되는군..
        }).promise()
        return result
    }
}

/**
 * 
 * @param temperature temperature to insert
 * @returns 
 */
const insertTemperature = async (temperature: string) => {
    const datetime = new Date().toISOString()
    const item: PutItemInputAttributeMap = {
        'datetime': { S: datetime },
        'temperature': { N: temperature }
    }
    const result = await ddb.putItem({
        TableName: TABLE_NAME,
        Item: item
    }).promise()
    return getTemperatureAt(datetime)
}

const convert = (item: AttributeMap): TemperatureResponse => {
    return {
        temperature: Number(item['temperature'].N!),
        createdAt: item['datetime'].S!
    }
}

export { TemperatureResponse }

export { listTables }
export { getTemperatureAt }
export { getAllTemperatures }
export { insertTemperature }

export { convert }
