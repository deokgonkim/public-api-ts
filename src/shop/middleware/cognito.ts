import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from "jwks-rsa";

/**
 * The payload of a JWT token.
 * @typedef {Object} JwtPayload - The payload of a JWT token.
 * @property {string} sub - The unique identifier for the user.
 * @property {string} iss - The issuer of the token, typically the Cognito user pool URL.
 * @property {number} version - The version of the token.
 * @property {string} client_id - The client ID associated with the token.
 * @property {string} origin_jti - The original JWT ID.
 * @property {string} token_use - The intended use of the token (e.g., 'access').
 * @property {string} scope - The scopes associated with the token.
 * @property {number} auth_time - The time when the user was authenticated, in epoch time.
 * @property {number} exp - The expiration time of the token, in epoch time.
 * @property {number} iat - The time when the token was issued, in epoch time.
 * @property {string} jti - The unique identifier for the token.
 * @property {string} username - The username of the user.
 */

const client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key!.getPublicKey();
        callback(null, signingKey);
    });
    return;
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
    // method check
    if (req.method === 'OPTIONS') {
        next();
        return;
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).send("Access token is missing or invalid");
        return;
    }

    jwt.verify(token, getKey, {
        audience: process.env.COGNITO_CLIENT_ID,
        issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`
    }, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (err) {
            return res.status(401).send("Access token is invalid");
        }
        req.user = decoded;
        // console.log('User', req.user);
        next();
    });
}
