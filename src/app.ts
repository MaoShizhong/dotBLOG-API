import express, { RequestHandler } from 'express';
import { ValidationChain } from 'express-validator';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';

import { indexRouter } from './routes/index';
import { authorRouter } from './routes/author';
import { postsRouter } from './routes/posts';
import { commentsRouter } from './routes/comments';
import { readersRouter } from './routes/readers';

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

app.use('/', indexRouter);
app.use('/author', authorRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/readers', readersRouter);

/*
    - Listen
*/
app.listen(process.env.PORT || '3000');
