"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRouter = void 0;
const express_1 = require("express");
// import * as postsController from '../controllers/posts_controller';
exports.postsRouter = (0, express_1.Router)();
exports.postsRouter.get('/', (req, res) => {
    res.json({ message: 'posts get' });
});
exports.postsRouter.post('/', (req, res) => {
    res.json({ message: 'posts post' });
});
exports.postsRouter.put('/', (req, res) => {
    res.json({ message: 'posts put' });
});
exports.postsRouter.delete('/', (req, res) => {
    res.json({ message: 'posts delete' });
});
