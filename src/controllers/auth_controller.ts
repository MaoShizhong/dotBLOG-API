import { User, UserModel } from '../models/User';
import { NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { generateTokens } from '../auth/tokens';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import { Comment } from '../models/Comment';

export interface AuthenticatedRequest extends Request {
    username: string;
    isAuthor: boolean;
}

configDotenv();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const UNAUTHORIZED = { message: 'Could not authenticate - access denied' };
const INCORRECT_LOGIN = { message: 'Incorrect username or password ' };

/*
    - User creation
*/
const createNewUser: FormPOSTHandler = [
    body('name').optional().trim().notEmpty(),
    body('username')
        .isLength({ min: 4 })
        .withMessage('Username must be at least 3 characters and cannot contain spaces')
        .custom((username: string): boolean => /^[^\n\r\s]{3,}$/.test(username))
        .withMessage('Username must not contain spaces'),
    body(
        'password',
        'Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter and 1 number'
    ).isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }),

    expressAsyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(401).json(errors.array());
            return;
        }

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword): Promise<void> => {
            try {
                const user = new User({
                    name: req.body.name || undefined,
                    username: req.body.username,
                    password: hashedPassword,
                    isAuthor: !!req.query.author,
                });

                await user.save();

                res.status(201).json({ success: true });
            } catch (err) {
                next(err);
            }
        });
    }),
];

/*
    - Login/logout
*/
const login: FormPOSTHandler = [
    body('username', 'Username cannot be empty').notEmpty(),
    body('password', 'Password cannot be empty').notEmpty(),

    expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(401).json(UNAUTHORIZED);
            return;
        }

        const user = await User.findOne({ username: req.body.username }).exec();
        if (!user) {
            res.status(401).json(INCORRECT_LOGIN);
            return;
        }

        // Must be separate from above in case of no user - will be unable to read user.password
        const matchingPassword = await bcrypt.compare(req.body.password, user.password);
        if (!matchingPassword) {
            res.status(401).json(INCORRECT_LOGIN);
            return;
        }

        const [accessToken, refreshToken] = generateTokens(
            {
                user: user,
                secret: ACCESS_TOKEN_SECRET,
                expiry: '15m',
            },
            {
                user: user,
                secret: REFRESH_TOKEN_SECRET,
                expiry: '60m',
            }
        );

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000, // same age as refreshToken (60m in ms)
        })
            .header('authorization', accessToken)
            .json({ message: `Successfully logged in as: ${user.username}` });
    }),
];

const logout = (req: Request, res: Response): void => {
    const cookies = req.cookies?.jwt;
    if (!cookies) {
        res.sendStatus(204);
        return;
    }

    res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ message: 'Successful logout - cleared cookies' });
};

/*
    - JWTs/auth
*/
const refreshAccessToken = (req: Request, res: Response): void => {
    const refreshToken: string | undefined = req.cookies?.jwt;

    if (!refreshToken) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }

    try {
        const decodedUser = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;
        console.info(decodedUser);
        const [newAccessToken, newRefreshToken] = generateTokens(
            {
                user: decodedUser,
                secret: ACCESS_TOKEN_SECRET,
                expiry: '15m',
            },
            {
                user: decodedUser,
                secret: REFRESH_TOKEN_SECRET,
                expiry: '60m',
            }
        );

        console.log(newAccessToken);
        console.log('-----');
        console.log(newRefreshToken);

        res.header('authorization', newAccessToken)
            .cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000, // same age as refreshToken (60m in ms)
            })
            .json({ message: 'Tokens refreshed' });
    } catch (error) {
        res.status(400).send('Invalid refresh token.');
    }
};

const authJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeaderWithBearer = req.headers?.authorization;

    if (!authHeaderWithBearer || !authHeaderWithBearer.startsWith('Bearer')) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }

    // Get the token portion of the auth header
    const accessToken = authHeaderWithBearer.split(' ')[1];

    try {
        const decodedUser = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as JwtPayload;

        (req as AuthenticatedRequest).username = decodedUser.username;
        (req as AuthenticatedRequest).isAuthor = decodedUser.isAuthor;

        next();
    } catch (error) {
        console.error(error);
        res.status(403).json(UNAUTHORIZED);
    }
};

const authAuthor = (req: Request, res: Response, next: NextFunction): void => {
    const isAuthor = (req as AuthenticatedRequest)?.isAuthor;
    console.log(isAuthor);

    if (!isAuthor) {
        res.status(401).json(UNAUTHORIZED);
    } else {
        next();
    }
};

const authCommenter = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const comment = await Comment.findById(req.params.commentID)
            .populate<{ commenter: UserModel }>('user')
            .exec();
        const usernameToAuthenticate = (req as AuthenticatedRequest).username;

        if (!comment || comment.commenter.username !== usernameToAuthenticate) {
            res.status(401).json(UNAUTHORIZED);
        } else {
            next();
        }
    }
);

export { createNewUser, login, logout, refreshAccessToken, authJWT, authAuthor, authCommenter };
