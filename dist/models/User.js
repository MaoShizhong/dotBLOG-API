"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.colours = void 0;
const mongoose_1 = require("mongoose");
exports.colours = [
    '#696869',
    '#0C374D',
    '#196A69',
    '#5C8F4C',
    '#277932',
    '#BD722E',
    '#D4B527',
    '#A83C2E',
    '#9C4E9A',
    '#693E9B',
];
const UserSchema = new mongoose_1.Schema({
    name: { type: String, default: undefined },
    username: { type: String, unique: true, required: true },
    avatar: {
        type: String,
        required: true,
        enum: exports.colours,
        default: '#696869',
    },
    password: { type: String, required: true },
    bookmarks: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'post' }],
    isAuthor: { type: Boolean, default: false, required: true },
}, { versionKey: false });
UserSchema.virtual('url').get(function () {
    return `/users/${this._id}`;
});
exports.User = (0, mongoose_1.model)('user', UserSchema);
