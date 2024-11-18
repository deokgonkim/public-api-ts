import axios from 'axios';

const tossApi = axios.create({
    baseURL: 'https://api.tosspayments.com',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.TOSS_AUTH_TOKEN}`,
    },
});

/**
 * 토스 결제 수단 코드 (method)
 * 결제수단입니다. 카드, 가상계좌, 간편결제, 휴대폰, 계좌이체, 문화상품권, 도서문화상품권, 게임문화상품권 중 하나입니다
 * 
 * 토스 결제 상태 코드 (status)
 * 결제 처리 상태입니다. 아래와 같은 상태 값을 가질 수 있습니다. 상태 변화 흐름이 궁금하다면 흐름도를 살펴보세요.

  - READY: 결제를 생성하면 가지게 되는 초기 상태입니다. 인증 전까지는 READY 상태를 유지합니다.

  - IN_PROGRESS: 결제수단 정보와 해당 결제수단의 소유자가 맞는지 인증을 마친 상태입니다. 결제 승인 API를 호출하면 결제가 완료됩니다.

  - WAITING_FOR_DEPOSIT: 가상계좌 결제 흐름에만 있는 상태로, 결제 고객이 발급된 가상계좌에 입금하는 것을 기다리고 있는 상태입니다.

  - DONE: 인증된 결제수단 정보, 고객 정보로 요청한 결제가 승인된 상태입니다.

  - CANCELED: 승인된 결제가 취소된 상태입니다.

  - PARTIAL_CANCELED: 승인된 결제가 부분 취소된 상태입니다.

  - ABORTED: 결제 승인이 실패한 상태입니다.

  - EXPIRED: 결제 유효 시간 30분이 지나 거래가 취소된 상태입니다. IN_PROGRESS 상태에서 결제 승인 API를 호출하지 않으면 EXPIRED가 됩니다.
 */

export const processTossPayment = async (
    orderId: string, // orderUid
    amount: number,
    paymentKey: string,
) => {
    const apiUrl = `/v1/payments/confirm`;
    const payload = {
        paymentKey,
        orderId,
        amount,
    };

    const response = await tossApi
        .post(apiUrl, payload)

    return response.data;
}

export const cancelTossPayment = async (
    paymentKey: string,
    cancelAmount: number,
    cancelReason?: string,
) => {
    // https://docs.tosspayments.com/reference#%EA%B2%B0%EC%A0%9C-%EC%B7%A8%EC%86%8C
    const apiUrl = `/v1/payments/${paymentKey}/cancel`;
    const payload = {
        cancelAmount,
        cancelReason,
    };
    const response = await tossApi
        .post(apiUrl, payload);

    return response.data;
}
