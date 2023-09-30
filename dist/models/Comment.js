"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    commenter: { type: mongoose_1.Schema.Types.ObjectId, ref: 'user' },
    post: { type: mongoose_1.Schema.Types.ObjectId, ref: 'post', required: true },
    timestamp: { type: Date, required: true },
    text: { type: String, required: true },
    replies: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'comment' }],
    deleted: { type: Boolean, default: false, required: true },
    isReply: { type: Boolean, default: false, required: true },
}, { versionKey: false });
exports.Comment = (0, mongoose_1.model)('comment', CommentSchema);
