"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    commenter: { type: mongoose_1.Schema.Types.ObjectId, ref: 'user', required: true },
    post: { type: mongoose_1.Schema.Types.ObjectId, ref: 'post', required: true },
    timestamp: { type: Date, required: true },
    lastEdited: { type: Date, default: undefined },
    text: { type: String, required: true },
    replies: [{ type: mongoose_1.Schema.Types.ObjectId, rel: 'Comment' }],
}, { versionKey: false });
exports.Comment = (0, mongoose_1.model)('comment', CommentSchema);
