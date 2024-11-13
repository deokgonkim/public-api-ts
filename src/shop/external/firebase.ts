import * as firebase from "firebase-admin";
import { Fcm } from "../repository";

const serviceAccount = require("../../../service-account.json");
console.log("serviceAccount.project_id", serviceAccount.project_id);

const admin = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

export const sendMessage = (fcmToken: string, message: string) => {
  const messagePayload = {
    notification: {
      title: "New message",
      body: message,
    },
    token: fcmToken,
  };

  return admin
    .messaging()
    .send(messagePayload)
    .then(async (result) => {
      await Fcm.recordFcmSent(result, fcmToken, message);
      return result;
    })
    .catch(async (err) => {
      await Fcm.updateFcmToken(fcmToken, {
        code: err.code,
        message: err.message,
      });
    });
};
