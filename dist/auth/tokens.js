"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
function generateTokens(...tokens) {
    const signedJWTs = [];
    tokens.forEach((token) => {
        signedJWTs.push(jsonwebtoken_1.default.sign({
            _id: token.user._id,
            username: token.user.username,
            avatar: token.user.avatar,
            fontColour: token.user.fontColour,
            bookmarks: token.user.bookmarks,
            isAuthor: token.user.isAuthor,
        }, token.secret, { expiresIn: token.expiry }));
    });
    return signedJWTs;
}
exports.generateTokens = generateTokens;
