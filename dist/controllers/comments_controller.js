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
exports.destroyPostComments = exports.deleteUserComments = exports.deleteComment = exports.editComment = exports.postNewComment = exports.getCommentReplies = exports.getSpecificComment = exports.getAllComments = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const Comment_1 = require("../models/Comment");
const posts_controller_1 = require("./posts_controller");
const Post_1 = require("../models/Post");
const populate_options_1 = require("../population/populate_options");
const DATABASE_UPDATE_ERROR = { message: 'Error updating database' };
/*
    - GET
*/
const getAllComments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchFilter = Object.assign(Object.assign({}, (req.params.postID && { post: req.params.postID, isReply: false })), (req.params.readerID && { commenter: req.params.readerID }));
    // get all comments and 2 levels of replies
    // (default view - user can manually expand to fetch further comment levels)
    const allComments = yield Comment_1.Comment.find(searchFilter)
        .populate('commenter', 'username avatar fontColour -_id')
        .populate(populate_options_1.deepPopulateFromLevelOne)
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
        .populate('commenter', 'username avatar fontColour -_id')
        .exec();
    if (!comment) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        res.json(comment);
    }
}));
exports.getSpecificComment = getSpecificComment;
const getCommentReplies = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.commentID)) {
        res.status(400).json(posts_controller_1.INVALID_ID);
        return;
    }
    const commentWithReplies = yield Comment_1.Comment.findById(req.params.commentID)
        .populate('commenter', 'username avatar fontColour -_id')
        .populate(populate_options_1.deepPopulateFromLevelTwo)
        .exec();
    if (!commentWithReplies) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        res.json(commentWithReplies);
    }
}));
exports.getCommentReplies = getCommentReplies;
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
            res.status(400).json({
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
                isReply: !!req.query.parent,
            });
            const [savedComment, updatedPost] = yield Promise.all([
                comment.save(),
                Post_1.Post.findOneAndUpdate({ _id: req.params.postID }, { $inc: { commentCount: 1 } }, { new: true }).exec(),
            ]);
            // If new comment is a reply to another comment, push its _id to the parent's replies array
            if (req.query.parent) {
                const [commentRepliedOn] = yield Promise.all([
                    Comment_1.Comment.findByIdAndUpdate(req.query.parent, {
                        $push: { replies: savedComment._id },
                    }, { new: true })
                        .populate('commenter', 'username  avatar fontColour -_id')
                        .populate(populate_options_1.deepPopulateFromLevelTwo)
                        .exec(),
                    savedComment.populate('commenter', 'username avatar fontColour -_id'),
                ]);
                if (commentRepliedOn) {
                    res.json(commentRepliedOn);
                    return;
                }
            }
            else {
                yield savedComment.populate('commenter', 'username avatar fontColour -_id');
                if (savedComment && updatedPost) {
                    res.json(savedComment);
                    return;
                }
            }
            res.status(500).json(DATABASE_UPDATE_ERROR);
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
                    isReply: existingComment.isReply,
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
    }, { new: true })
        .populate('commenter', 'username avatar fontColour -_id')
        .exec();
    if (!deletedComment) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        // Retain populate level else cannot display comment details
        if (req.query.level === '1' || req.query.level === '2') {
            yield deletedComment.populate(req.query.level === '1' ? populate_options_1.deepPopulateFromLevelOne : populate_options_1.deepPopulateFromLevelTwo);
        }
        res.json(deletedComment);
    }
}));
exports.deleteComment = deleteComment;
// All user comments upon account deletion
const deleteUserComments = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield Comment_1.Comment.updateMany({ commenter: req.params.userID }, { text: '', deleted: true }).exec();
    next();
}));
exports.deleteUserComments = deleteUserComments;
// All user comments upon account deletion
const destroyPostComments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Comment_1.Comment.deleteMany({ post: req.params.postID }).exec();
    res.json({ message: 'Post and associated comments deleted' });
}));
exports.destroyPostComments = destroyPostComments;
