import express, { RequestHandler } from 'express';
import { ValidationChain } from 'express-validator';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';

import { router } from './routes/router';

declare global {
    interface Error {
        status?: number;
    }

    type FormPOSTHandler = Array<ValidationChain | RequestHandler>;
}

const app = express();
configDotenv();

/*
    - Mongoose setup
*/
mongoose.set('strictQuery', false);

const main = async () => await mongoose.connect(process.env.CONNECTION_STRING!);
main().catch((err): void => console.error(err));

/*
    - Initialise middleware
*/
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(helmet());

app.use('/', router);

/*
    - Listen
*/
app.listen(process.env.PORT || '3000');

/*
    - Close MongoDB connection on program exit
*/
['SIGINT', 'exit'].forEach((exitEvent): void => {
    process.on(exitEvent, (): void => {
        mongoose.connection.close();
    });
});
