"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.categories = void 0;
const mongoose_1 = require("mongoose");
exports.categories = ['Javascript/Typescript', 'HTML', 'CSS', 'Other'];
const PostSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.Mixed, ref: 'user', required: true },
    title: { type: String, required: true },
    timestamp: { type: Date, required: true },
    category: {
        type: String,
        required: true,
        enum: exports.categories,
        default: 'Other',
    },
    text: { type: [String], required: true },
    isPublished: { type: Boolean, required: true },
}, { toJSON: { virtuals: true }, versionKey: false });
PostSchema.virtual('url').get(function () {
    return `/posts/${this._id}`;
});
exports.Post = (0, mongoose_1.model)('post', PostSchema);
