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
exports.deleteUser = exports.changeAvatarColour = exports.changeUsername = exports.toggleBookmark = void 0;
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
const changeUsername = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.query.username)
        next();
    const [currentUser, existingUsername] = yield Promise.all([
        User_1.User.findById(req.params.userID).exec(),
        User_1.User.findOne({ username: req.query.username }).exec(),
    ]);
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) === req.query.username) {
        next();
    }
    else if (existingUsername) {
        res.status(403).json({ message: 'Username already taken' });
    }
    else {
        yield User_1.User.findByIdAndUpdate(req.params.userID, { username: req.query.username });
        req.username = req.query.username;
        next();
    }
}));
exports.changeUsername = changeUsername;
const changeAvatarColour = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.query.avatar) {
        next();
    }
    else if (!/^[0-9A-F]{6}$/.test(req.query.avatar)) {
        res.status(400).json(posts_controller_1.INVALID_QUERY);
        return;
    }
    const colour = `#${req.query.avatar}`;
    yield User_1.User.findByIdAndUpdate(req.params.userID, { avatar: colour }).exec();
    req.avatar = colour;
    next();
}));
exports.changeAvatarColour = changeAvatarColour;
const deleteUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('delete');
    const deletedUser = User_1.User.findByIdAndDelete(req.params.userID).exec();
    if (!deletedUser) {
        res.status(404).json(posts_controller_1.DOES_NOT_EXIST);
    }
    else {
        next();
    }
}));
exports.deleteUser = deleteUser;
