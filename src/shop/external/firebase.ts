import * as firebase from "firebase-admin";

const serviceAccount = require('../../../service-account.json');
console.log('serviceAccount.project_id', serviceAccount.project_id);

const admin = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
})

export const sendMessage = (fcmToken: string, message: string) => {
    const messagePayload = {
        notification: {
            title: 'New message',
            body: message,
        },
        token: fcmToken,
    };

    return admin.messaging().send(messagePayload);
}
