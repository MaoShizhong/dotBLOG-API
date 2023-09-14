"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Author = void 0;
const mongoose_1 = require("mongoose");
const AuthorModel = new mongoose_1.Schema({
    name: { type: String, required: true },
});
exports.Author = (0, mongoose_1.model)('author', AuthorModel);
