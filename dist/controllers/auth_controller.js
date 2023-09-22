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
exports.authCommenter = exports.authAuthor = exports.authJWT = exports.refreshAccessToken = exports.logout = exports.login = exports.createNewUser = void 0;
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
const UNAUTHORIZED = { message: 'Could not authenticate - access denied' };
const INCORRECT_LOGIN = { message: 'Incorrect username or password ' };
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
                    password: hashedPassword,
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
const login = [
    (0, express_validator_1.body)('username', 'Username cannot be empty').notEmpty(),
    (0, express_validator_1.body)('password', 'Password cannot be empty').notEmpty(),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(401).json(UNAUTHORIZED);
            return;
        }
        const user = yield User_1.User.findOne({ username: req.body.username }).exec();
        if (!user) {
            res.status(401).json({ message: 'incorrect username mate!' });
            return;
        }
        // Must be separate from above in case of no user - will be unable to read user.password
        const matchingPassword = yield bcrypt_1.default.compare(req.body.password, user.password);
        if (!matchingPassword) {
            res.status(401).json(INCORRECT_LOGIN);
            return;
        }
        const [accessToken, refreshToken] = (0, tokens_1.generateTokens)({
            user: user,
            secret: ACCESS_TOKEN_SECRET,
            expiry: '15m',
        }, {
            user: user,
            secret: REFRESH_TOKEN_SECRET,
            expiry: '4h',
        });
        res.header('Authorization', accessToken)
            .cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 4 * 60 * 60 * 1000, // same age as refreshToken (60m in ms)
        })
            .json({ username: user.username });
    })),
];
exports.login = login;
const logout = (req, res) => {
    var _a;
    const cookies = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt;
    if (!cookies) {
        res.sendStatus(204);
        return;
    }
    res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ message: 'Successful logout - cleared cookies' });
};
exports.logout = logout;
/*
    - JWTs/auth
*/
const refreshAccessToken = (req, res) => {
    var _a;
    const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt;
    if (!refreshToken) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }
    try {
        const decodedUser = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const [newAccessToken, newRefreshToken] = (0, tokens_1.generateTokens)({
            user: decodedUser,
            secret: ACCESS_TOKEN_SECRET,
            expiry: '15m',
        }, {
            user: decodedUser,
            secret: REFRESH_TOKEN_SECRET,
            expiry: '60m',
        });
        res.header('Authorization', newAccessToken)
            .cookie('jwt', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000, // same age as refreshToken (60m in ms)
        })
            .json({ message: 'Tokens refreshed', username: decodedUser.username });
    }
    catch (error) {
        res.status(401).json(UNAUTHORIZED);
    }
};
exports.refreshAccessToken = refreshAccessToken;
const authJWT = (req, res, next) => {
    var _a;
    const authHeaderWithBearer = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization;
    if (!authHeaderWithBearer || !authHeaderWithBearer.startsWith('Bearer')) {
        res.status(401).json(UNAUTHORIZED);
        return;
    }
    // Get the token portion of the auth header
    const accessToken = authHeaderWithBearer.split(' ')[1];
    try {
        const decodedUser = jsonwebtoken_1.default.verify(accessToken, ACCESS_TOKEN_SECRET);
        req.username = decodedUser.username;
        req.isAuthor = decodedUser.isAuthor;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(403).json(UNAUTHORIZED);
    }
};
exports.authJWT = authJWT;
const authAuthor = (req, res, next) => {
    const isAuthor = req === null || req === void 0 ? void 0 : req.isAuthor;
    if (!isAuthor) {
        res.status(401).json(UNAUTHORIZED);
    }
    else {
        next();
    }
};
exports.authAuthor = authAuthor;
const authCommenter = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield Comment_1.Comment.findById(req.params.commentID)
        .populate('user')
        .exec();
    const usernameToAuthenticate = req.username;
    if (!comment || comment.commenter.username !== usernameToAuthenticate) {
        res.status(401).json(UNAUTHORIZED);
    }
    else {
        next();
    }
}));
exports.authCommenter = authCommenter;
