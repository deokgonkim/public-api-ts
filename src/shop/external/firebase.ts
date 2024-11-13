import * as firebase from "firebase-admin";
import { Fcm } from "../repository";

const serviceAccount = require("../../../service-account.json");
console.log("serviceAccount.project_id", serviceAccount.project_id);

const admin = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

export const sendMessage = (fcmToken: string, message: string, data: any) => {
  const stripUndefined = (obj: any) => {
    return Object.keys(obj).reduce((acc: { [key: string]: any }, key) => {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }
      return acc;
    }, {} as { [key: string]: any });
  };
  const messagePayload = {
    notification: {
      title: "New message",
      body: message,
    },
    data: Object.keys(stripUndefined(data)).length > 0 ? data : undefined,
    token: fcmToken,
  };

  return admin
    .messaging()
    .send(messagePayload)
    .then(async (result) => {
      await Fcm.updateFcmToken(fcmToken, {
        code: "success",
        lastSent: new Date().toISOString(),
      });
      await Fcm.recordFcmSent(
        result,
        fcmToken,
        JSON.stringify(messagePayload, null, 4)
      );
      return result;
    })
    .catch(async (err) => {
      console.log("Error sending message", err);
      await Fcm.updateFcmToken(fcmToken, {
        code: err.code,
        lastErrorMessage: err.message,
      });
    });
};
