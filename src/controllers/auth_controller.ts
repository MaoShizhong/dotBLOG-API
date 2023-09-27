import { Colour, User, UserModel } from '../models/User';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { generateTokens } from '../auth/tokens';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import { Comment } from '../models/Comment';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
    _id: Types.ObjectId;
    user: UserModel;
    username: string;
    avatar: Colour;
    bookmarks: Types.ObjectId[];
    isAuthor: boolean;
}

configDotenv();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export const UNAUTHORIZED = { message: 'Could not authenticate - access denied' } as const;
const NOT_AUTHOR = { message: 'Could not authenticate as an author - access denied' } as const;
const INCORRECT_LOGIN = { message: 'Incorrect username or password ' } as const;

const cookieOptions: CookieOptions = { httpOnly: true, secure: true, sameSite: 'none' };

export const cmsOrigins = ['https://dotblog-cms.netlify.app', 'http://localhost:5174'];

const expiry = {
    accessString: '10m',
    accessMS: 10 * 60 * 1000,
    refreshString: '4h',
    refreshMS: 4 * 60 * 60 * 1000,
} as const;

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
    body('confirm', 'Passwords must match').custom(
        (confirm, { req }): boolean => confirm === req.body.password
    ),
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
                    avatar: '#696869',
                    password: hashedPassword as string,
                    bookmarks: [] as Types.ObjectId[],
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
const attemptLogin: FormPOSTHandler = [
    body('username', 'Username cannot be empty').notEmpty(),
    body('password', 'Password cannot be empty').notEmpty(),

    expressAsyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        if (!req.headers.origin) {
            res.status(401).json(UNAUTHORIZED);
            return;
        }

        if (cmsOrigins.includes(req.headers.origin) && !user.isAuthor) {
            res.status(403).json(NOT_AUTHOR);
        } else {
            (req as AuthenticatedRequest).user = user;
            next();
        }
    }),
];

const approveLogin = (req: Request, res: Response): void => {
    const user = (req as AuthenticatedRequest).user;

    const [accessToken, refreshToken] = generateTokens(
        {
            user: user,
            secret: ACCESS_TOKEN_SECRET,
            expiry: expiry.accessString,
        },
        {
            user: user,
            secret: REFRESH_TOKEN_SECRET,
            expiry: expiry.refreshString,
        }
    );

    res.cookie('access', accessToken, { ...cookieOptions, maxAge: expiry.accessMS })
        .cookie('refresh', refreshToken, { ...cookieOptions, maxAge: expiry.refreshMS })
        .json({
            id: user._id,
            username: user.username,
            avatar: user.avatar,
            bookmarkedPosts: user.bookmarks,
        });
};

const logout = (req: Request, res: Response): void => {
    const cookies = req.cookies;

    if (!cookies.refresh && !cookies.access) {
        res.sendStatus(204);
        return;
    }

    res.clearCookie('access', { ...cookieOptions, maxAge: expiry.refreshMS })
        .clearCookie('refresh', { ...cookieOptions, maxAge: expiry.refreshMS })
        .json({
            message: 'Successful logout - cleared cookies',
        });
};

/*
    - JWTs/auth
*/
const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const accessToken: string | undefined = req.cookies?.access;

    if (!accessToken) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }

    try {
        const decodedUser = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as JwtPayload;

        const request = req as AuthenticatedRequest;
        request._id = decodedUser._id;
        request.username = decodedUser.username;
        request.isAuthor = decodedUser.isAuthor;

        next();
    } catch (error) {
        console.error(error);
        res.status(403).json(UNAUTHORIZED);
    }
};

const authenticateAuthor = (req: Request, res: Response, next: NextFunction): void => {
    const isAuthor = (req as AuthenticatedRequest)?.isAuthor;

    if (!isAuthor) {
        res.status(401).json(UNAUTHORIZED);
    } else {
        next();
    }
};

const authenticateSameUser = (req: Request, res: Response, next: NextFunction): void => {
    const _id = (req as AuthenticatedRequest)._id;

    if (_id.valueOf() === req.params.userID) {
        next();
    } else {
        res.status(401).json(UNAUTHORIZED);
    }
};

const authenticateCommenter = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const comment = await Comment.findById(req.params.commentID)
            .populate<{ commenter: UserModel }>('commenter', 'username -_id')
            .exec();
        const usernameToAuthenticate = (req as AuthenticatedRequest).username;

        if (comment && comment.commenter.username === usernameToAuthenticate) {
            next();
        } else {
            res.status(401).json(UNAUTHORIZED);
        }
    }
);

const refreshAccessToken = (req: Request, res: Response): void => {
    const refreshToken: string | undefined = req.cookies?.refresh;

    if (!refreshToken) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }

    try {
        const decodedUser = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;

        const request = req as AuthenticatedRequest;

        if (request.bookmarks) {
            decodedUser.bookmarks = request.bookmarks;
        }
        if (request.username) {
            decodedUser.username = request.username;
        }
        if (request.avatar) {
            decodedUser.avatar = request.avatar;
        }

        const [newAccessToken, newRefreshToken] = generateTokens(
            {
                user: decodedUser,
                secret: ACCESS_TOKEN_SECRET,
                expiry: expiry.accessString,
            },
            {
                user: decodedUser,
                secret: REFRESH_TOKEN_SECRET,
                expiry: expiry.refreshString,
            }
        );

        res.cookie('access', newAccessToken, { ...cookieOptions, maxAge: expiry.accessMS })
            .cookie('refresh', newRefreshToken, { ...cookieOptions, maxAge: expiry.refreshMS })
            .json({
                id: decodedUser._id,
                username: decodedUser.username,
                avatar: decodedUser.avatar,
                bookmarkedPosts: decodedUser.bookmarks,
            });
    } catch (error) {
        res.status(401).json(UNAUTHORIZED);
    }
};

export {
    createNewUser,
    attemptLogin,
    approveLogin,
    logout,
    refreshAccessToken,
    authenticateJWT,
    authenticateAuthor,
    authenticateSameUser,
    authenticateCommenter,
};
