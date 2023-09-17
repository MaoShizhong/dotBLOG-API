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
exports.postNewArticle = void 0;
const express_validator_1 = require("express-validator");
const Post_1 = require("../models/Post");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
// POST REQUEST
exports.postNewArticle = [
    (0, express_validator_1.body)('title', 'Title must not be empty').trim().notEmpty().escape(),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options').toLowerCase().isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer((text) => 
    // Convert text into array of paragraphs
    text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n')),
    // Selection will be converted into a boolean, with the default value being false unless the
    // 'yes' option was selected specifically
    (0, express_validator_1.body)('isPublished')
        .trim()
        .toLowerCase()
        .escape()
        .customSanitizer((selection) => selection === 'yes'),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        }
        // Only create and store a new post if no errors
        const post = new Post_1.Post({
            author: 'Mao',
            title: req.body.title,
            timestamp: new Date(),
            category: req.body.category,
            text: req.body.text,
            published: req.body.isPublished,
        });
        // await post.save();
        res.json(post);
    })),
];
