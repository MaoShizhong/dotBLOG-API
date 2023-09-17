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
exports.editPost = exports.deletePost = exports.postNewPost = exports.getSpecificPost = exports.getAllPosts = void 0;
const express_validator_1 = require("express-validator");
const Post_1 = require("../models/Post");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = require("mongoose");
const INVALID_ID = { message: 'Failed to fetch - invalid ID format', status: 400 };
const DOES_NOT_EXIST = {
    message: 'Failed to fetch - no post with that ID',
    status: 404,
};
// GET ALL POSTS
exports.getAllPosts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Show newest posts first
    const posts = yield Post_1.Post.find().sort({ timestamp: -1 }).exec();
    res.json(posts);
}));
// GET INDIVIDUAL POST
exports.getSpecificPost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(INVALID_ID);
        return;
    }
    const post = yield Post_1.Post.findById(req.params.postID).exec();
    if (!post) {
        res.status(404).json(DOES_NOT_EXIST);
    }
    else {
        res.json(post);
    }
}));
// POST REQUEST
exports.postNewPost = [
    (0, express_validator_1.body)('title', 'Title must not be empty').trim().notEmpty().escape(),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options').toLowerCase().isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer((text) => 
    // Convert text into array of paragraphs
    text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n')),
    // Selection will be converted into a boolean, with the default value being false unless the
    // 'yes' option was selected specifically
    (0, express_validator_1.body)('isPublished')
        .trim()
        .toLowerCase()
        .escape()
        .customSanitizer((selection) => selection === 'yes'),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        }
        else {
            // Only create and store a new post if no errors
            const post = new Post_1.Post({
                author: 'Mao',
                title: req.body.title,
                timestamp: new Date(),
                category: req.body.category,
                text: req.body.text,
                isPublished: req.body.isPublished,
            });
            yield post.save();
            res.json(post);
        }
    })),
];
// DELETE INDIVIDUAL POST
exports.deletePost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(INVALID_ID);
        return;
    }
    const deletedPost = yield Post_1.Post.findByIdAndDelete(req.params.postID).exec();
    if (!deletedPost) {
        res.status(404).json(DOES_NOT_EXIST);
    }
    else {
        res.json(deletedPost);
    }
}));
// PUT - EDIT INDIVIDUAL POST
exports.editPost = [
    (0, express_validator_1.body)('title', 'Title must not be empty').optional().trim().notEmpty().escape(),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options')
        .toLowerCase()
        .optional()
        .isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .optional()
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer((text) => 
    // Convert text into array of paragraphs
    text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n')),
    // Selection will be converted into a boolean, with the default value being false unless the
    // 'yes' option was selected specifically
    (0, express_validator_1.body)('isPublished')
        .optional()
        .trim()
        .toLowerCase()
        .escape()
        .customSanitizer((selection) => selection === 'yes'),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(INVALID_ID);
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        }
        else {
            const existingPost = yield Post_1.Post.findById(req.params.postID).exec();
            if (!existingPost) {
                res.status(404).json(DOES_NOT_EXIST);
            }
            else {
                // Only create and store a new post if no errors
                const editedPost = new Post_1.Post({
                    _id: existingPost._id,
                    author: existingPost.author,
                    title: (_a = req.body.title) !== null && _a !== void 0 ? _a : existingPost.title,
                    timestamp: existingPost.timestamp,
                    category: (_b = req.body.category) !== null && _b !== void 0 ? _b : existingPost.category,
                    text: (_c = req.body.text) !== null && _c !== void 0 ? _c : existingPost.text,
                    isPublished: (_d = req.body.isPublished) !== null && _d !== void 0 ? _d : existingPost.isPublished,
                });
                yield Post_1.Post.findByIdAndUpdate(req.params.postID, editedPost, {});
                res.json(editedPost);
            }
        }
    })),
];
