import {
    APIGatewayClient,
    GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';

exports.handler = async event => {
    let statusCode, apiKey;
    console.log('event', JSON.stringify(event, null, 4));

    const client = new APIGatewayClient({});
    const getCommand = new GetApiKeysCommand({ nameQuery: 'test', includeValues: true });
    const keys = await client.send(getCommand);
    if (keys?.items?.length != 1) {
        throw new Error('Trial key not found');
    }
    apiKey = keys?.items?.[0]?.value;
    statusCode = 200;

    // https://docs.readme.com/main/docs/user-data-options
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            version: 1,
            apiKey: apiKey
        })
    };
};