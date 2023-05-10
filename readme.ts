import {
    APIGatewayClient,
    CreateApiKeyCommand,
    CreateUsagePlanKeyCommand,
    GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';
import * as readme from 'readmeio';

// Your ReadMe secret; you may want to store this in AWS Secrets Manager
const README_SECRET = process.env.README_SECRET || '';

// Your default API Gateway usage plan; this will be attached to new API keys being created
const DEFAULT_USAGE_PLAN_ID = process.env.AWS_DEFAULT_USAGE_PLAN_ID || '';

exports.handler = async event => {
    let statusCode, email, apiKey, error;
    console.log('event', JSON.stringify(event, null, 4));
    try {
        // Verify the request is legitimate and came from ReadMe.
        const signature = event.headers['ReadMe-Signature'];
        const body = JSON.parse(event.body);
        readme.verifyWebhook(body, signature, README_SECRET);

        // Look up the API key associated with the user's email address.
        const email = body.email;
        const client = new APIGatewayClient({});
        const getCommand = new GetApiKeysCommand({ nameQuery: email, includeValues: true });
        const keys = await client.send(getCommand);
        if (keys?.items?.length > 0) {
            // If multiple API keys are returned for the given email, use the first one.
            apiKey = keys?.items?.[0]?.value;
            statusCode = 200;
            console.log(`Found key for ${email}`);
        } else {
            // If no API keys were found, create a new key and apply a usage plan.
            const createKeyCommand = new CreateApiKeyCommand({
                name: email,
                description: `API key for ReadMe user ${email}`,
                tags: {
                    user: email,
                    vendor: 'ReadMe',
                },
                enabled: true,
            });
            const key = await client.send(createKeyCommand);

            const usagePlanKeyCommand = new CreateUsagePlanKeyCommand({
                usagePlanId: DEFAULT_USAGE_PLAN_ID,
                keyId: key.id,
                keyType: 'API_KEY',
            });
            await client.send(usagePlanKeyCommand);
            console.log(`Created key for ${email}`);

            apiKey = key.value;
            statusCode = 200;
        }
    } catch (e) {
        error = e.message;
        console.log(e);
        statusCode = error.match(/Signature/) ? 401 : 500;
    }

    // https://docs.readme.com/main/docs/user-data-options
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: email,
            email: email,
            version: 1,
            apiKey: apiKey
        })
    };
};