"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSameCommenter = exports.authenticateSameUser = exports.authenticateAuthor = exports.authenticateJWT = exports.refreshAccessToken = exports.logout = exports.approveLogin = exports.attemptLogin = exports.createNewUser = exports.cmsOrigins = exports.UNAUTHORIZED = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const tokens_1 = require("../auth/tokens");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
const Comment_1 = require("../models/Comment");
(0, dotenv_1.configDotenv)();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
exports.UNAUTHORIZED = { message: 'Could not authenticate - access denied' };
const NOT_AUTHOR = { message: 'Could not authenticate as an author - access denied' };
const INCORRECT_LOGIN = { message: 'Incorrect username or password ' };
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'none' };
exports.cmsOrigins = ['https://dotblog-cms.netlify.app', 'http://localhost:5174'];
const expiry = {
    accessString: '10m',
    accessMS: 10 * 60 * 1000,
    refreshString: '4h',
    refreshMS: 4 * 60 * 60 * 1000,
};
/*
    - User creation
*/
const createNewUser = [
    (0, express_validator_1.body)('name').optional().trim().notEmpty(),
    (0, express_validator_1.body)('username')
        .isLength({ min: 4 })
        .withMessage('Username must be at least 3 characters and cannot contain spaces')
        .custom((username) => /^[^\n\r\s]{3,}$/.test(username))
        .withMessage('Username must not contain spaces'),
    (0, express_validator_1.body)('password', 'Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter and 1 number').isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }),
    (0, express_validator_1.body)('confirm', 'Passwords must match').custom((confirm, { req }) => confirm === req.body.password),
    (0, express_validator_1.body)('authorPassword', 'Incorrect author password - cannot create account')
        .optional({ values: 'undefined' })
        .matches(ADMIN_PASSWORD),
    (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(401).json({ errors: errors.array() });
            return;
        }
        bcrypt_1.default.hash(req.body.password, 10, (err, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const user = new User_1.User({
                    name: req.body.name || undefined,
                    username: req.body.username,
                    avatar: '#696869',
                    fontColour: '#FAFAFA',
                    password: hashedPassword,
                    bookmarks: [],
                    isAuthor: !!req.body.authorPassword,
                });
                yield user.save();
                // proceed to auto-login if sign up successful
                res.status(201);
                next();
            }
            catch (err) {
                // do not proceed to login if server error with password hashing
                res.status(500).json({
                    message: 'Unknown error in sign up - please try again in a few minutes',
                });
                return;
            }
        }));
    })),
];
exports.createNewUser = createNewUser;
/*
    - Login/logout
*/
const attemptLogin = [
    (0, express_validator_1.body)('username', 'Username cannot be empty').notEmpty(),
    (0, express_validator_1.body)('password', 'Password cannot be empty').notEmpty(),
    (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(401).json(exports.UNAUTHORIZED);
            return;
        }
        const user = yield User_1.User.findOne({ username: req.body.username }).exec();
        if (!user) {
            res.status(401).json(INCORRECT_LOGIN);
            return;
        }
        // Must be separate from above in case of no user - will be unable to read user.password
        const matchingPassword = yield bcrypt_1.default.compare(req.body.password, user.password);
        if (!matchingPassword) {
            res.status(401).json(INCORRECT_LOGIN);
            return;
        }
        if (!req.headers.origin) {
            res.status(401).json(exports.UNAUTHORIZED);
            return;
        }
        if (exports.cmsOrigins.includes(req.headers.origin) && !user.isAuthor) {
            res.status(403).json(NOT_AUTHOR);
        }
        else {
            req.user = user;
            next();
        }
    })),
];
exports.attemptLogin = attemptLogin;
function approveLogin(req, res) {
    const user = req.user;
    const [accessToken, refreshToken] = (0, tokens_1.generateTokens)({
        user: user,
        secret: ACCESS_TOKEN_SECRET,
        expiry: expiry.accessString,
    }, {
        user: user,
        secret: REFRESH_TOKEN_SECRET,
        expiry: expiry.refreshString,
    });
    res.cookie('access', accessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: expiry.accessMS }))
        .cookie('refresh', refreshToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: expiry.refreshMS }))
        .json({
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        bookmarkedPosts: user.bookmarks,
    });
}
exports.approveLogin = approveLogin;
function logout(req, res) {
    const cookies = req.cookies;
    if (!cookies.refresh && !cookies.access) {
        res.sendStatus(204);
        return;
    }
    res.clearCookie('access', Object.assign(Object.assign({}, cookieOptions), { maxAge: expiry.refreshMS }))
        .clearCookie('refresh', Object.assign(Object.assign({}, cookieOptions), { maxAge: expiry.refreshMS }))
        .json({
        message: 'Successful logout - cleared cookies',
    });
}
exports.logout = logout;
/*
    - JWTs/auth
*/
function authenticateJWT(req, res, next) {
    var _a;
    const accessToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.access;
    if (!accessToken) {
        res.status(401).json(exports.UNAUTHORIZED);
        return;
    }
    try {
        const decodedUser = jsonwebtoken_1.default.verify(accessToken, ACCESS_TOKEN_SECRET);
        const request = req;
        request._id = decodedUser._id;
        request.username = decodedUser.username;
        request.isAuthor = decodedUser.isAuthor;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(403).json(exports.UNAUTHORIZED);
    }
}
exports.authenticateJWT = authenticateJWT;
function authenticateAuthor(req, res, next) {
    const isAuthor = req === null || req === void 0 ? void 0 : req.isAuthor;
    if (!isAuthor) {
        res.status(401).json(exports.UNAUTHORIZED);
    }
    else {
        next();
    }
}
exports.authenticateAuthor = authenticateAuthor;
function authenticateSameUser(req, res, next) {
    const _id = req._id;
    if (_id.valueOf() === req.params.userID) {
        next();
    }
    else {
        res.status(401).json(exports.UNAUTHORIZED);
    }
}
exports.authenticateSameUser = authenticateSameUser;
const authenticateSameCommenter = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield Comment_1.Comment.findById(req.params.commentID)
        .populate('commenter', 'username -_id')
        .exec();
    const usernameToAuthenticate = req.username;
    if (comment && comment.commenter.username === usernameToAuthenticate) {
        next();
    }
    else {
        res.status(401).json(exports.UNAUTHORIZED);
    }
}));
exports.authenticateSameCommenter = authenticateSameCommenter;
function refreshAccessToken(req, res) {
    var _a;
    const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refresh;
    if (!refreshToken) {
        res.status(401).json(exports.UNAUTHORIZED);
        return;
    }
    try {
        const decodedUser = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const request = req;
        if (request.bookmarks) {
            decodedUser.bookmarks = request.bookmarks;
        }
        if (request.username) {
            decodedUser.username = request.username;
        }
        if (request.avatar) {
            decodedUser.avatar = request.avatar;
        }
        if (request.fontColour) {
            decodedUser.fontColour = request.fontColour;
        }
        const [newAccessToken, newRefreshToken] = (0, tokens_1.generateTokens)({
            user: decodedUser,
            secret: ACCESS_TOKEN_SECRET,
            expiry: expiry.accessString,
        }, {
            user: decodedUser,
            secret: REFRESH_TOKEN_SECRET,
            expiry: expiry.refreshString,
        });
        res.cookie('access', newAccessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: expiry.accessMS }))
            .cookie('refresh', newRefreshToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: expiry.refreshMS }))
            .json({
            id: decodedUser._id,
            username: decodedUser.username,
            avatar: decodedUser.avatar,
            fontColour: decodedUser.fontColour,
            bookmarkedPosts: decodedUser.bookmarks,
        });
    }
    catch (error) {
        res.status(401).json(exports.UNAUTHORIZED);
    }
}
exports.refreshAccessToken = refreshAccessToken;
