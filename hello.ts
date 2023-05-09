import { Handler } from 'aws-lambda';

export const handler: Handler = async (event: any) => {
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: 'Ok',
                data: "Wow Hello!"
            },
            null,
            2
        )
    }
}