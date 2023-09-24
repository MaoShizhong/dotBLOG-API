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
exports.deleteComment = exports.editComment = exports.postNewComment = exports.getSpecificComment = exports.getAllComments = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importStar(require("mongoose"));
const Comment_1 = require("../models/Comment");
const posts_controller_1 = require("./posts_controller");
/*
    - GET
*/
exports.getAllComments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchFilter = Object.assign(Object.assign({}, (req.params.postID && { post: req.params.postID })), (req.params.readerID && { commenter: req.params.readerID }));
    const allComments = yield Comment_1.Comment.find(searchFilter)
        .populate('comments')
        .sort({ timestamp: -1 })
        .exec();
    res.json(allComments);
}));
exports.getSpecificComment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.commentID)) {
        res.status(400).json(posts_controller_1.INVALID_ID);
        return;
    }
    const comment = yield Comment_1.Comment.findById(req.params.commentID).exec();
    if (!comment) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        res.json(comment);
    }
}));
/*
    - POST
*/
exports.postNewComment = [
    (0, express_validator_1.body)('text', 'Comment cannot be empty')
        .trim()
        .notEmpty()
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
                // TODO: Change when auth added for logged in reader!
                commenter: new mongoose_1.default.Types.ObjectId('650884f8d099ae8404f13ffb'),
                timestamp: new Date(),
                text: req.body.text,
            });
            yield comment.save();
            res.status(201).json(comment);
        }
    })),
];
/*
    - PUT
*/
exports.editComment = [
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
                    timestamp: existingComment.timestamp,
                    text: req.body.text,
                });
                const editedComment = yield Comment_1.Comment.findByIdAndUpdate(req.params.commentID, commentWithEdits, { new: true });
                res.json(editedComment);
            }
        }
    })),
];
/*
    - DELETE
*/
exports.deleteComment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.commentID)) {
        res.status(400).json(posts_controller_1.INVALID_ID);
        return;
    }
    const deletedComment = yield Comment_1.Comment.findByIdAndDelete(req.params.commentID).exec();
    if (!deletedComment) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        res.status(204).json(deletedComment);
    }
}));
