import { onOrderChange } from "./order";

describe("test event", () => {
  it("should able to send fcm message", async () => {
    const testEvent = {
      Records: [
        {
          eventID: "5b405e6acc1b8185891dd9f2e15f08a0",
          eventName: "INSERT",
          eventVersion: "1.1",
          eventSource: "aws:dynamodb",
          awsRegion: "ap-northeast-2",
          dynamodb: {
            ApproximateCreationDateTime: 1731403719,
            Keys: { orderId: { S: "QUWbJ5tCkJXYcqMYwrtvA" } },
            NewImage: {
              createdAt: { S: "2024-11-12T09:28:39.211Z" },
              total: { N: "0" },
              orderId: { S: "QUWbJ5tCkJXYcqMYwrtvA" },
              customerId: { S: "39B1vrNzS09ONdXXAV2FM" },
              shopId: { S: "l-k2E348xgkDCkmq8gM6_" },
              items: {
                L: [
                  {
                    M: {
                      quantity: { N: "1" },
                      price: { N: "0" },
                      name: { S: "테스트" },
                    },
                  },
                ],
              },
              customer: {
                M: {
                  createdAt: { S: "2024-11-12T05:23:38.833Z" },
                  phone: { S: "+821056632546" },
                  name: { S: "김덕곤" },
                  customerId: { S: "39B1vrNzS09ONdXXAV2FM" },
                  shopId: { S: "l-k2E348xgkDCkmq8gM6_" },
                },
              },
              shopUid: { S: "dgkim1111" },
              status: { S: "created" },
            },
            SequenceNumber: "6055600001605312321470904",
            SizeBytes: 364,
            StreamViewType: "NEW_AND_OLD_IMAGES",
          },
          eventSourceARN:
            "arn:aws:dynamodb:ap-northeast-2:172094616731:table/public-shop-orders/stream/2024-11-11T07:29:46.830",
        },
      ],
    };
    await onOrderChange(testEvent, null);
  }, 30000);
});
