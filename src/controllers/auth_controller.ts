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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const UNAUTHORIZED = { message: 'Could not authenticate - access denied' } as const;
const INCORRECT_LOGIN = { message: 'Incorrect username or password ' } as const;

const EXPIRY = { accessString: '2s', refreshString: '4h', refreshMS: 4 * 60 * 60 * 1000 } as const;

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
    body('authorPassword', 'Incorrect author password - cannot create account')
        .optional({ values: 'undefined' })
        .matches(ADMIN_PASSWORD),

    expressAsyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(401).json({ errors: errors.array() });
            return;
        }

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword): Promise<void> => {
            try {
                const user = new User({
                    name: (req.body.name as string) || undefined,
                    username: req.body.username as string,
                    password: hashedPassword as string,
                    isAuthor: !!req.body.authorPassword,
                });

                await user.save();

                // proceed to auto-login if sign up successful
                res.status(201);
                next();
            } catch (err) {
                // do not proceed to login if server error with password hashing
                res.status(500).json({
                    message: 'Unknown error in sign up - please try again in a few minutes',
                });
                return;
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
            res.status(401).json({ message: 'incorrect username mate!' });
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
                expiry: EXPIRY.accessString,
            },
            {
                user: user,
                secret: REFRESH_TOKEN_SECRET,
                expiry: EXPIRY.refreshString,
            }
        );

        res.header('Authorization', `Bearer ${accessToken}`)
            .cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: EXPIRY.refreshMS, // same age as refreshToken (4h in ms)
            })
            .json({ username: user.username });
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

const refreshAccessToken = (req: Request, res: Response): void => {
    const refreshToken: string | undefined = req.cookies?.jwt;

    if (!refreshToken) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }

    try {
        const decodedUser = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;

        const [newAccessToken, newRefreshToken] = generateTokens(
            {
                user: decodedUser,
                secret: ACCESS_TOKEN_SECRET,
                expiry: EXPIRY.accessString,
            },
            {
                user: decodedUser,
                secret: REFRESH_TOKEN_SECRET,
                expiry: EXPIRY.refreshString,
            }
        );

        res.header('Authorization', `Bearer ${newAccessToken}`)
            .cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: EXPIRY.refreshMS, // same age as refreshToken (4h in ms)
            })
            .json({ message: 'Tokens refreshed', username: decodedUser.username });
    } catch (error) {
        res.status(401).json(UNAUTHORIZED);
    }
};

export { createNewUser, login, logout, refreshAccessToken, authJWT, authAuthor, authCommenter };
