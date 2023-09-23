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
exports.convertToArrayOfParagraphs = exports.deletePost = exports.publishPost = exports.editPost = exports.postNewPost = exports.getSpecificPost = exports.getAllPosts = exports.DOES_NOT_EXIST = exports.INVALID_QUERY = exports.INVALID_ID = void 0;
const express_validator_1 = require("express-validator");
const Post_1 = require("../models/Post");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
exports.INVALID_ID = { message: 'Failed to fetch - invalid ID format' };
exports.INVALID_QUERY = { message: 'Failed to fetch - invalid query' };
exports.DOES_NOT_EXIST = { message: 'Failed to fetch - no resource with that ID' };
/*
    - GET
*/
exports.getAllPosts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Show newest posts first
    const posts = yield Post_1.Post.find()
        .populate('author', '-_id name username')
        .sort({ timestamp: -1 })
        .exec();
    res.json(posts);
}));
// GET INDIVIDUAL POST
exports.getSpecificPost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(exports.INVALID_ID);
        return;
    }
    const post = yield Post_1.Post.findById(req.params.postID).populate('author', 'name -_id').exec();
    if (post) {
        res.json(post);
    }
    else {
        res.status(404).json(exports.DOES_NOT_EXIST);
    }
}));
/*
    - POST
*/
exports.postNewPost = [
    (0, express_validator_1.body)('title', 'Title must not be empty').trim().notEmpty().escape(),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options').isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer(convertToArrayOfParagraphs),
    /* If not checked, field will not be submitted (undefined) - checking submits a truthy string */
    (0, express_validator_1.body)('publish')
        .optional({ values: undefined })
        .custom((value) => !!value),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(401).json({
                errors: errors.array(),
            });
        }
        else {
            // Only authorised authors will reach this point
            const author = yield User_1.User.findOne({
                username: req.username,
            }).exec();
            // Very unlikely safeguard
            if (!author) {
                res.status(404).json({ message: 'Author does not exist ' });
                return;
            }
            const post = new Post_1.Post({
                author: new mongoose_1.Types.ObjectId(author._id),
                title: req.body.title,
                timestamp: new Date(),
                category: req.body.category,
                text: req.body.text,
                isPublished: !!req.body.publish,
            });
            yield post.save();
            yield post.populate('author', 'name -_id');
            res.status(201).json(post);
        }
    })),
];
/*
    - PUT
*/
exports.editPost = [
    (0, express_validator_1.body)('title', 'Title must not be empty').trim().notEmpty().escape(),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options').isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer((text) => 
    // Convert text into array of paragraphs
    text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n')),
    /* If not checked, field will not be submitted (undefined) - checking submits a truthy string */
    (0, express_validator_1.body)('publish')
        .optional({ values: undefined })
        .custom((value) => !!value),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(exports.INVALID_ID);
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
                res.status(404).json(exports.DOES_NOT_EXIST);
            }
            else {
                // Only create and store a new post if no errors
                const postWithEdits = new Post_1.Post({
                    _id: existingPost._id,
                    author: existingPost.author,
                    title: (_a = req.body.title) !== null && _a !== void 0 ? _a : existingPost.title,
                    timestamp: existingPost.timestamp,
                    category: (_b = req.body.category) !== null && _b !== void 0 ? _b : existingPost.category,
                    text: (_c = req.body.text) !== null && _c !== void 0 ? _c : existingPost.text,
                    isPublished: req.body.publish || existingPost.isPublished,
                });
                const editedPost = yield Post_1.Post.findByIdAndUpdate(req.params.postID, postWithEdits, {
                    new: true,
                }).populate('author', 'name -_id');
                res.json(editedPost);
            }
        }
    })),
];
/*
    - PATCH
*/
exports.publishPost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID) ||
        !['true', 'false'].includes(req.query.publish)) {
        const message = !mongoose_1.Types.ObjectId.isValid(req.params.postID) ? exports.INVALID_ID : exports.INVALID_QUERY;
        res.status(400).json(message);
        return;
    }
    const editedPost = yield Post_1.Post.findByIdAndUpdate(req.params.postID, { isPublished: req.query.publish === 'true' }, { new: true })
        .populate('author', 'name -_id')
        .exec();
    if (!editedPost) {
        res.status(404).json(exports.DOES_NOT_EXIST);
    }
    else {
        res.json(editedPost);
    }
}));
/*
    - DELETE
*/
exports.deletePost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(exports.INVALID_ID);
        return;
    }
    const deletedPost = yield Post_1.Post.findByIdAndDelete(req.params.postID).exec();
    if (!deletedPost) {
        res.status(404).json(exports.DOES_NOT_EXIST);
    }
    else {
        res.status(204).json(deletedPost);
    }
}));
function convertToArrayOfParagraphs(text) {
    // Convert text into array of paragraphs
    return text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n');
}
exports.convertToArrayOfParagraphs = convertToArrayOfParagraphs;
