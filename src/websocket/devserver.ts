import WebSocket from "ws";
import { complete } from "./openai";

const port = 3002;

const wss = new WebSocket.Server({ port });

wss.on("connection", (ws) => {
    console.log("New client connected");
    ws.on("message", (message) => {
        console.log(`Received message => ${message}`);
        try {
            const payload = JSON.parse(message.toString());
            if (payload.type == 'chat') {
                // ws.send(JSON.stringify({ type: 'chat', message: 'chat received' }));
                complete(payload.data).then(async (stream) => {
                    for await (const chunk of stream) {
                        const message = chunk.choices?.[0]?.delta?.content;
                        console.log('sending', message)
                        if (message) ws.send(JSON.stringify({ type: 'chat', data: message }));
                    }
                });
            } else {
                ws.send(JSON.stringify({ error: 'Unknown message type', message: `${payload.type}` }));
            }
        } catch (e) {
            console.error('error', e);
            ws.send(JSON.stringify({ error: 'Invalid message format', message: `${e}` }));
        }
        // ws.send(`Hello, you sent => ${message}`);
    });
});
