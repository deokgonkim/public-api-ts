import { AdminGetUserCommand, CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { UserShop } from "../repository/shop";

const client = new CognitoIdentityProvider({
    region: process.env.AWS_REGION,
});

// cognito response
// export interface UserAttribute {
//     Name: string;
//     Value: string;
// }

// export interface User {
//     Username: string;
//     UserStatus: string;
//     UserCreateDate: Date;
//     UserLastModifiedDate: Date;
//     Enabled: boolean;

//     UserAttributes: UserAttribute[];
// }

export interface UserProfile {
    username: string;
    status: string;
    email?: string;
    emailVerified?: boolean;
    phone?: string;
    phoneVerified?: boolean;
    createdAt?: Date;
    lastModifiedAt?: Date;
    userShops?: Partial<UserShop>[];
}

/**
 * Get user information from Cognito
 * @param username
 */
export const getUserProfile = async (username: string): Promise<UserProfile> => {
    try {
        const command = new AdminGetUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
        });

        const response = await client.send(command);
        // return {
        //     Username: response.Username!,
        //     UserStatus: response.UserStatus!,
        //     UserCreateDate: response.UserCreateDate!,
        //     UserLastModifiedDate: response.UserLastModifiedDate!,
        //     Enabled: response.Enabled!,
        //     UserAttributes: response.UserAttributes as UserAttribute[] ?? [],
        // };
        return {
            username: response.Username!,
            status: response.UserStatus!,
            email: response.UserAttributes?.find((attr) => attr.Name === 'email')?.Value,
            emailVerified: response.UserAttributes?.find((attr) => attr.Name === 'email_verified')?.Value === 'true',
            phone: response.UserAttributes?.find((attr) => attr.Name === 'phone_number')?.Value,
            phoneVerified: response.UserAttributes?.find((attr) => attr.Name === 'phone_number_verified')?.Value === 'true',
            createdAt: response.UserCreateDate!,
            lastModifiedAt: response.UserLastModifiedDate!,
        }
    } catch (e) {
        console.error(e);
        if (e instanceof Error) {
            throw new Error('Could not get user', { cause: e });
        } else {
            throw new Error('Could not get user');
        }
    }
}
