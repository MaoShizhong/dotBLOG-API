"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    commenter: { type: mongoose_1.Schema.Types.ObjectId, rel: 'Reader', required: true },
    timestamp: { type: Date, required: true },
    text: { type: [String], required: true },
}, { versionKey: false });
exports.Comment = (0, mongoose_1.model)('comment', CommentSchema);
