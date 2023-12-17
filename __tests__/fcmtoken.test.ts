
import { createOrUpdateFcmToken, getFcmToken } from '../lib/fcmtoken'

const fcmToken = 'test';

test('test getFcmToken', async () => {
    const result = await getFcmToken(fcmToken);
    console.log(result);
});

test('update test', async () => {
    const result = await createOrUpdateFcmToken({
        fcmToken: fcmToken,
        username: 'test',
        datetime: new Date().toISOString()
    });

    console.log(result);
});
