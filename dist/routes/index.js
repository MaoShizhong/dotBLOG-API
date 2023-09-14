"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexRouter = void 0;
const express_1 = require("express");
// import * as indexController from '../controllers/index_controller';
exports.indexRouter = (0, express_1.Router)();
exports.indexRouter.get('/', (req, res) => {
    res.json({ message: 'index get' });
});
exports.indexRouter.post('/', (req, res) => {
    res.json({ message: 'index post' });
});
exports.indexRouter.put('/', (req, res) => {
    res.json({ message: 'index put' });
});
exports.indexRouter.delete('/', (req, res) => {
    res.json({ message: 'index delete' });
});
