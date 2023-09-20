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
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const resource_router_1 = require("./routes/resource_router");
const auth_router_1 = require("./routes/auth_router");
const app = (0, express_1.default)();
(0, dotenv_1.configDotenv)();
/*
    - Mongoose setup
*/
mongoose_1.default.set('strictQuery', false);
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.CONNECTION_STRING);
    });
}
try {
    connectToDatabase();
}
catch (error) {
    console.error(error);
}
/*
    - Initialise middleware
*/
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use('/', resource_router_1.resourceRouter);
app.use('/auth', auth_router_1.authRouter);
/*
    - Listen
*/
app.listen(process.env.PORT || '3000');
/*
    - Close MongoDB connection on program exit
*/
['SIGINT', 'exit'].forEach((exitEvent) => {
    process.on(exitEvent, () => {
        mongoose_1.default.connection.close();
    });
});
