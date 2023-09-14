"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readersRouter = void 0;
const express_1 = require("express");
// import * as readersController from '../controllers/readers_controller';
exports.readersRouter = (0, express_1.Router)();
exports.readersRouter.get('/', (req, res) => {
    res.json({ message: 'readers get' });
});
exports.readersRouter.post('/', (req, res) => {
    res.json({ message: 'readers post' });
});
exports.readersRouter.put('/', (req, res) => {
    res.json({ message: 'readers put' });
});
exports.readersRouter.delete('/', (req, res) => {
    res.json({ message: 'readers delete' });
});
