
import { getFcmToken } from '../lib/fcmtoken'

const fcmToken = 'test';

test('test getFcmToken', async () => {
    const result = await getFcmToken(fcmToken);
    console.log(result);
})
