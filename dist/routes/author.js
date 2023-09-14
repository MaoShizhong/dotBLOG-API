"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorRouter = void 0;
const express_1 = require("express");
// import * as authorController from '../controllers/author_controller';
exports.authorRouter = (0, express_1.Router)();
exports.authorRouter.get('/', (req, res) => {
    res.json({ message: 'author get' });
});
exports.authorRouter.post('/', (req, res) => {
    res.json({ message: 'author post' });
});
exports.authorRouter.put('/', (req, res) => {
    res.json({ message: 'author put' });
});
exports.authorRouter.delete('/', (req, res) => {
    res.json({ message: 'author delete' });
});
