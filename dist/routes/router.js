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
exports.router = void 0;
const express_1 = require("express");
const postsController = __importStar(require("../controllers/posts_controller"));
const commentsController = __importStar(require("../controllers/comments_controller"));
exports.router = (0, express_1.Router)();
/*
    - Handle posts
*/
exports.router.get('/posts/', postsController.getAllPosts);
exports.router.get('/posts/:postID', postsController.getSpecificPost);
exports.router.post('/posts/', postsController.postNewPost);
exports.router.put('/posts/:postID', postsController.editPost);
exports.router.delete('/posts/:postID', postsController.deletePost);
/*
    - Handle comments
*/
exports.router.get('/posts/:postID/comments', commentsController.getAllComments);
exports.router.get('/readers/:readerID/comments', commentsController.getAllComments);
exports.router.post('/posts/:postID/comments', commentsController.postNewComment);
exports.router.get('/comments/:commentID', commentsController.getSpecificComment);
exports.router.put('/comments/:commentID', commentsController.editComment);
exports.router.delete('/comments/:commentID', commentsController.deleteComment);
/*
    - Handle readers
*/
