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
const auth_controller_1 = require("../controllers/auth_controller");
exports.resourceRouter = (0, express_1.Router)();
/*
    - Handle posts
*/
exports.resourceRouter.get('/posts', postsController.getAllPosts);
exports.resourceRouter.get('/posts/:postID', postsController.getSpecificPost);
exports.resourceRouter.post('/posts', auth_controller_1.authJWT, auth_controller_1.authAuthor, postsController.postNewPost);
exports.resourceRouter.put('/posts/:postID', auth_controller_1.authJWT, auth_controller_1.authAuthor, postsController.editPost);
// For setting an unpublished post to published only
exports.resourceRouter.patch('/posts/:postID', auth_controller_1.authJWT, auth_controller_1.authAuthor, postsController.publishPost);
exports.resourceRouter.delete('/posts/:postID', auth_controller_1.authJWT, auth_controller_1.authAuthor, postsController.deletePost);
/*
    - Handle comments
*/
exports.resourceRouter.get('/posts/:postID/comments', commentsController.getAllComments);
exports.resourceRouter.get('/readers/:readerID/comments', commentsController.getAllComments);
exports.resourceRouter.post('/posts/:postID/comments', auth_controller_1.authJWT, auth_controller_1.authCommenter, commentsController.postNewComment);
exports.resourceRouter.get('/comments/:commentID', commentsController.getSpecificComment);
exports.resourceRouter.put('/comments/:commentID', auth_controller_1.authJWT, auth_controller_1.authCommenter, commentsController.editComment);
exports.resourceRouter.delete('/comments/:commentID', auth_controller_1.authJWT, auth_controller_1.authCommenter, commentsController.deleteComment);
