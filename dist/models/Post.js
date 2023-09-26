"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.objectFits = exports.categories = void 0;
const mongoose_1 = require("mongoose");
exports.categories = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Other'];
exports.objectFits = ['object-contain', 'object-cover'];
const PostSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.Mixed, ref: 'user', required: true },
    title: { type: String, required: true },
    imageURL: String,
    objectFit: { type: String, enum: exports.objectFits, default: 'object-contain' },
    timestamp: { type: Date, required: true },
    category: {
        type: String,
        required: true,
        enum: exports.categories,
        default: 'Other',
    },
    text: { type: String, required: true },
    commentCount: { type: Number, default: 0, required: true },
    isPublished: { type: Boolean, default: false, required: true },
    isFeatured: { type: Boolean, default: false, required: true },
}, { toJSON: { virtuals: true }, versionKey: false });
PostSchema.virtual('url').get(function () {
    return `/posts/${this._id}`;
});
PostSchema.virtual('clientURL').get(function () {
    const titleInURL = this.title
        .toLowerCase()
        .replaceAll(/[^\w\s]/gi, '')
        .replaceAll(/\s+/g, '-');
    const categoryInURL = this.category.toLowerCase();
    return `/${categoryInURL}/${titleInURL}-${this._id}`;
});
exports.Post = (0, mongoose_1.model)('post', PostSchema);
