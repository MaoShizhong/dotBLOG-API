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
exports.postRouter = void 0;
const express_1 = require("express");
const postsController = __importStar(require("../controllers/posts_controller"));
const commentsController = __importStar(require("../controllers/comments_controller"));
const authController = __importStar(require("../controllers/auth_controller"));
exports.postRouter = (0, express_1.Router)();
/*
    - Handle posts
*/
exports.postRouter.get('/', postsController.getAllPosts);
exports.postRouter.get('/:postID', postsController.getSpecificPost);
exports.postRouter.post('/', authController.authenticateJWT, authController.authenticateAuthor, postsController.postNewPost);
exports.postRouter.put('/:postID', authController.authenticateJWT, authController.authenticateAuthor, postsController.editPost);
// For setting an unpublished post to published only
exports.postRouter.patch('/:postID', authController.authenticateJWT, authController.authenticateAuthor, postsController.toggleFeaturedPublished);
exports.postRouter.delete('/:postID', authController.authenticateJWT, authController.authenticateAuthor, postsController.deletePost, commentsController.destroyPostComments);
/*
    - Handle comments on a post
*/
exports.postRouter.get('/:postID/comments', commentsController.getAllComments);
exports.postRouter.post('/:postID/comments', authController.authenticateJWT, commentsController.postNewComment);
