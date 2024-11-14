import { Socket } from "../shop/repository";

export const handler = async (event) => {
    console.log('event', JSON.stringify(event, null, 4));
    await Socket.deleteConnection(event.requestContext.connectionId);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'disconnectHandler',
            event,
        }),
    };
};
