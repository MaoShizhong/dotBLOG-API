"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleBookmark = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = require("../models/User");
const posts_controller_1 = require("./posts_controller");
const mongoose_1 = require("mongoose");
const toggleBookmark = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.User.findById(req.params.userID).exec();
    // guard clauses
    if (!user) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
        return;
    }
    else if (!req.query.post || !req.query.bookmark) {
        res.status(400).json(posts_controller_1.INVALID_QUERY);
        return;
    }
    else if (!mongoose_1.Types.ObjectId.isValid(req.query.post)) {
        res.status(400).json(posts_controller_1.INVALID_ID);
    }
    // actual action if validated
    if (req.query.bookmark === 'true') {
        user.bookmarks.push(new mongoose_1.Types.ObjectId(req.query.post));
    }
    else {
        user.bookmarks = user.bookmarks.filter((postID) => {
            return postID.valueOf() !== req.query.post;
        });
    }
    yield user.save();
    req.bookmarks = user.bookmarks;
    next();
}));
exports.toggleBookmark = toggleBookmark;
