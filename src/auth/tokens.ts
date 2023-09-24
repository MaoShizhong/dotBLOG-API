import { UserModel } from '../models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';

type TokenInfo = {
    user: UserModel | JwtPayload;
    secret: string;
    expiry: string;
};

configDotenv();

export function generateTokens(...tokens: TokenInfo[]): string[] {
    const signedJWTs: string[] = [];

    tokens.forEach((token) => {
        signedJWTs.push(
            jwt.sign(
                {
                    username: token.user.username,
                    bookmarks: token.user.bookmarks,
                    isAuthor: token.user.isAuthor,
                },
                token.secret,
                { expiresIn: token.expiry }
            )
        );
    });

    return signedJWTs;
}
