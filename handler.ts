import { Handler } from 'aws-lambda'
import { APIGatewayEvent } from 'aws-lambda'
import { Key } from 'aws-sdk/clients/dynamodb'
import { TemperatureResponse, getAllTemperatures, insertTemperature, convert } from './lib/dynamodb'

export const list: Handler = async (event: any) => {
  console.log(`event : ${JSON.stringify(event, null, 4)}`)
  const param = event.queryStringParameters || {}
  // const tables = await listTables()
  const dt = param.dt || ''
  const pageSize = Number(param.pageSize) || 20
  const lastKey: Key = {}
  if (param.lastKey) {
    lastKey.datetime = {"S": param.lastKey}
  }
  const data = await getAllTemperatures(dt, pageSize, param.lastKey ? lastKey : undefined)
  console.log(`Raw Response ${JSON.stringify(data, null, 4)}`)
  const response: TemperatureResponse[] = []
  if (data) {
    response.push(...data.Items!.map(o => convert(o)))
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Ok',
        data: response
      },
      null,
      2
    )
  }
}

export const insert: Handler = async (event: APIGatewayEvent) => {
  console.log(`event : ${JSON.stringify(event, null, 4)}`)
  const param = event.queryStringParameters || {}
  const contentType = event.headers['content-type']
  let temperature
  if (contentType == 'application/json') {
    const body = JSON.parse(event.body!)
    temperature = String(body.temperature)
  } else if (contentType == 'application/x-www-form-urlencoded') {
    if (event.isBase64Encoded) {
      temperature = Buffer.from(event.body!, 'base64')
    } else {
      temperature = event.body
    }
  } else {
    temperature = String(event.queryStringParameters!['temperature'])
  }
  if (temperature) {
    const result = await insertTemperature(temperature)

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Inserted Temperature',
          temperature: result.Item!.temperature.N!,
          createdAt: result.Item!.datetime.S!
        },
        null,
        4
      )
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: 'missing parameter `temperature`'
        },
        null,
        4
      )
    }
  }
}