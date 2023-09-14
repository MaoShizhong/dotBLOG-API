"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
// import * as commentsController from '../controllers/comments_controller';
exports.commentsRouter = (0, express_1.Router)();
exports.commentsRouter.get('/', (req, res) => {
    res.json({ message: 'comments get' });
});
exports.commentsRouter.post('/', (req, res) => {
    res.json({ message: 'comments post' });
});
exports.commentsRouter.put('/', (req, res) => {
    res.json({ message: 'comments put' });
});
exports.commentsRouter.delete('/', (req, res) => {
    res.json({ message: 'comments delete' });
});
