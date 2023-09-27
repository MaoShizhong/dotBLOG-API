"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, default: undefined },
    username: { type: String, unique: true, required: true },
    avatar: {
        type: String,
        required: true,
        default: '#696869',
    },
    fontColour: {
        type: String,
        required: true,
        enum: ['#FAFAFA', '#2A2A27'],
        default: '#FAFAFA',
    },
    password: { type: String, required: true },
    bookmarks: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'post' }],
    isAuthor: { type: Boolean, default: false, required: true },
}, { versionKey: false });
UserSchema.virtual('url').get(function () {
    return `/users/${this._id}`;
});
exports.User = (0, mongoose_1.model)('user', UserSchema);
