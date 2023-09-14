"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongoose_1 = require("mongoose");
const PostSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.ObjectId, rel: 'Author', required: true },
    timestamp: { type: Date, required: true },
    category: {
        type: String,
        required: true,
        enum: ['javascript', 'html', 'css', 'other'],
        default: 'other',
    },
    text: { type: [String], required: true },
    published: { type: Boolean, required: true },
});
PostSchema.virtual('url').get(function () {
    return `/authors/${this._id}`;
});
exports.Post = (0, mongoose_1.model)('post', PostSchema);
