"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.categories = void 0;
const mongoose_1 = require("mongoose");
exports.categories = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Other'];
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
    text: { type: String, required: true },
    comments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'comment' }],
    isPublished: { type: Boolean, default: false, required: true },
    isFeatured: { type: Boolean, default: false, required: true },
}, { toJSON: { virtuals: true }, versionKey: false });
PostSchema.virtual('url').get(function () {
    return `/posts/${this._id}`;
});
PostSchema.virtual('clientURL').get(function () {
    const titleInURL = this.title.toLowerCase().replaceAll(' ', '-');
    const categoryInURL = this.category.toLowerCase();
    return `/${categoryInURL}/${titleInURL}`;
});
exports.Post = (0, mongoose_1.model)('post', PostSchema);
