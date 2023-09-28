"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const postsController = __importStar(require("../controllers/posts_controller"));
const commentsController = __importStar(require("../controllers/comments_controller"));
const userController = __importStar(require("../controllers/user_controller"));
const authController = __importStar(require("../controllers/auth_controller"));
exports.userRouter = (0, express_1.Router)();
/*
    - Handle user-specific resources
*/
exports.userRouter.get('/:userID/bookmarks', authController.authenticateJWT, postsController.getBookmarkedPosts);
exports.userRouter.get('/:userID/comments', commentsController.getAllComments);
/*
    - Handle user details
*/
// Refresh after patching bookmark to update cookies with updated bookmark data (else refreshing
// the site will load the outdated bookmark data into state)
exports.userRouter.patch('/:userID', authController.authenticateJWT, userController.toggleBookmark, authController.refreshAccessToken);
exports.userRouter.put('/:userID', authController.authenticateJWT, authController.authenticateSameUser, userController.changeUsername, userController.changeAvatarColour, authController.refreshAccessToken);
exports.userRouter.delete('/:userID', authController.authenticateJWT, authController.authenticateSameUser, userController.deleteUser, commentsController.deleteUserComments, authController.logout);
