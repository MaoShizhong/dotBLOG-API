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
                    _id: token.user._id,
                    username: token.user.username,
                    avatar: token.user.avatar,
                    fontColour: token.user.fontColour,
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
