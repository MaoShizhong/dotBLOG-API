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
exports.deleteUserComments = exports.deleteComment = exports.editComment = exports.postNewComment = exports.getSpecificComment = exports.getAllComments = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const Comment_1 = require("../models/Comment");
const posts_controller_1 = require("./posts_controller");
const Post_1 = require("../models/Post");
const DATABASE_UPDATE_ERROR = { message: 'Error updating database' };
/*
    - GET
*/
const getAllComments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchFilter = Object.assign(Object.assign({}, (req.params.postID && { post: req.params.postID })), (req.params.readerID && { commenter: req.params.readerID }));
    const allComments = yield Comment_1.Comment.find(searchFilter)
        .populate('commenter', 'username avatar -_id')
        .sort({ timestamp: -1 })
        .exec();
    res.json(allComments);
}));
exports.getAllComments = getAllComments;
const getSpecificComment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.commentID)) {
        res.status(400).json(posts_controller_1.INVALID_ID);
        return;
    }
    const comment = yield Comment_1.Comment.findById(req.params.commentID)
        .populate('commenter', 'username avatar -_id')
        .exec();
    if (!comment) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        res.json(comment);
    }
}));
exports.getSpecificComment = getSpecificComment;
/*
    - POST
*/
const postNewComment = [
    (0, express_validator_1.body)('text', 'Comment cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer(posts_controller_1.removeDangerousScriptTags),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        }
        else {
            // Only create and store a new post if no errors
            const comment = new Comment_1.Comment({
                commenter: new mongoose_1.Types.ObjectId(req.query.commenterID),
                post: new mongoose_1.Types.ObjectId(req.params.postID),
                timestamp: new Date(),
                text: req.body.text,
                replies: [],
                deleted: false,
            });
            const [savedComment, updatedPost] = yield Promise.all([
                comment.save(),
                Post_1.Post.findOneAndUpdate({ _id: req.params.postID }, { $inc: { commentCount: 1 } }, { new: true }).exec(),
            ]);
            yield savedComment.populate('commenter', 'username avatar -_id');
            if (savedComment && updatedPost) {
                res.status(201).json(savedComment);
            }
            else {
                res.status(500).json(DATABASE_UPDATE_ERROR);
            }
        }
    })),
];
exports.postNewComment = postNewComment;
/*
    - PUT
*/
const editComment = [
    (0, express_validator_1.body)('text', 'Comment cannot be empty')
        .trim()
        .notEmpty()
        .customSanitizer(posts_controller_1.removeDangerousScriptTags),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!mongoose_1.Types.ObjectId.isValid(req.params.commentID)) {
            res.status(400).json(posts_controller_1.INVALID_ID);
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        }
        else {
            const existingComment = yield Comment_1.Comment.findById(req.params.commentID).exec();
            if (!existingComment) {
                res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
            }
            else {
                const commentWithEdits = new Comment_1.Comment({
                    _id: existingComment._id,
                    commenter: existingComment.commenter,
                    post: existingComment.post,
                    timestamp: existingComment.timestamp,
                    text: req.body.text,
                    replies: existingComment.replies,
                    deleted: false,
                });
                const editedComment = yield Comment_1.Comment.findByIdAndUpdate(req.params.commentID, commentWithEdits, { new: true });
                res.json(editedComment);
            }
        }
    })),
];
exports.editComment = editComment;
/*
    - DELETE
*/
// Single comment
const deleteComment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.commentID)) {
        res.status(400).json(posts_controller_1.INVALID_ID);
        return;
    }
    const deletedComment = yield Comment_1.Comment.findByIdAndUpdate(req.params.commentID, {
        text: '',
        deleted: true,
    }).exec();
    if (!deletedComment) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        res.status(204).json(deletedComment);
    }
}));
exports.deleteComment = deleteComment;
// All user comments upon account deletion
const deleteUserComments = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('deleted all user comments');
    yield Comment_1.Comment.updateMany({ commenter: req.params.userID }, { text: '', deleted: true }).exec();
    next();
}));
exports.deleteUserComments = deleteUserComments;
