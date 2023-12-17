import { Handler } from 'aws-lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { createOrUpdateFcmToken } from './lib/fcmtoken';


export const registerFcmToken: Handler = async (event: APIGatewayEvent) => {
  console.log(`event : ${JSON.stringify(event, null, 4)}`);
  const param = event.queryStringParameters || {};
  const contentType = event.headers['content-type'];
  let datetime;
  let fcmToken;
  let username;
  if (contentType == 'application/json') {
    const body = JSON.parse(event.body!);
    fcmToken = body.fcmToken;
    username = body.username;
    datetime = body.datetime;
  } else {
    fcmToken = event.queryStringParameters!['fcmToken'];
    username = event.queryStringParameters!['username'];
    datetime = event.queryStringParameters!['datetime'];
  }

  const payload = {
    datetime,
    fcmToken,
    username
  };
  console.log(payload);
  const result = await createOrUpdateFcmToken(payload);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Inserted FcmToken',
      },
      null,
      4
    )
  }
}