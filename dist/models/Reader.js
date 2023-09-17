"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reader = void 0;
const mongoose_1 = require("mongoose");
const ReaderSchema = new mongoose_1.Schema({
    username: { type: String, unique: true, required: true },
});
ReaderSchema.virtual('url').get(function () {
    return `/users/${this._id}`;
});
exports.Reader = (0, mongoose_1.model)('reader', ReaderSchema);
