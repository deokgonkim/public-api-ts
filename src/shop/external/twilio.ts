import { Twilio } from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = new Twilio(accountSid, authToken);

export const sendMessage = async (from: string, to: string, message: string) => {
    return client.messages
        .create({
            body: message,
            from,
            to,
        })
        .then((message) => {
            console.log(message.sid);
            return message;
        });
};
