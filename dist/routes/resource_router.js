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
exports.resourceRouter = void 0;
const express_1 = require("express");
const postsController = __importStar(require("../controllers/posts_controller"));
const commentsController = __importStar(require("../controllers/comments_controller"));
const userController = __importStar(require("../controllers/user_controller"));
const auth_controller_1 = require("../controllers/auth_controller");
const auth_controller_2 = require("../controllers/auth_controller");
exports.resourceRouter = (0, express_1.Router)();
/*
    - Handle posts
*/
exports.resourceRouter.get('/posts', postsController.getAllPosts);
exports.resourceRouter.get('/posts/:postID', postsController.getSpecificPost);
exports.resourceRouter.get('/users/:userID/bookmarks', auth_controller_2.authenticateJWT, postsController.getBookmarkedPosts);
exports.resourceRouter.post('/posts', auth_controller_2.authenticateJWT, auth_controller_2.authenticateAuthor, postsController.postNewPost);
exports.resourceRouter.put('/posts/:postID', auth_controller_2.authenticateJWT, auth_controller_2.authenticateAuthor, postsController.editPost);
// For setting an unpublished post to published only
exports.resourceRouter.patch('/posts/:postID', auth_controller_2.authenticateJWT, auth_controller_2.authenticateAuthor, postsController.toggleFeaturedPublished);
exports.resourceRouter.delete('/posts/:postID', auth_controller_2.authenticateJWT, auth_controller_2.authenticateAuthor, postsController.deletePost);
/*
    - Handle comments
*/
exports.resourceRouter.get('/posts/:postID/comments', commentsController.getAllComments);
exports.resourceRouter.get('/users/:userID/comments', commentsController.getAllComments);
exports.resourceRouter.post('/posts/:postID/comments', auth_controller_2.authenticateJWT, commentsController.postNewComment);
exports.resourceRouter.get('/comments/:commentID', commentsController.getSpecificComment);
exports.resourceRouter.put('/comments/:commentID', auth_controller_2.authenticateJWT, auth_controller_2.authenticateCommenter, commentsController.editComment);
exports.resourceRouter.delete('/comments/:commentID', auth_controller_2.authenticateJWT, auth_controller_2.authenticateCommenter, commentsController.deleteComment);
/*
    - Handle user edit/delete
*/
// Refresh after patching bookmark to update cookies with updated bookmark data (else refreshing
// the site will load the outdated bookmark data into state)
exports.resourceRouter.patch('/users/:userID', auth_controller_2.authenticateJWT, userController.toggleBookmark, auth_controller_1.refreshAccessToken);
exports.resourceRouter.put('/users/:userID', auth_controller_2.authenticateJWT, auth_controller_1.authenticateSameUser, userController.changeUsername, userController.changeAvatarColour, auth_controller_1.refreshAccessToken);
