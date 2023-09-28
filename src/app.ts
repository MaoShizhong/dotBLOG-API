import express, { RequestHandler } from 'express';
import { ValidationChain } from 'express-validator';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import { configDotenv } from 'dotenv';

import { authRouter } from './routes/auth_router';
import { postRouter } from './routes/post_router';
import { userRouter } from './routes/user_router';
import { commentRouter } from './routes/comment_router';

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

async function connectToDatabase(): Promise<void> {
    await mongoose.connect(process.env.CONNECTION_STRING!);
}

try {
    connectToDatabase();
} catch (error) {
    console.error(error);
}

/*
    - Initialise middleware
*/
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'https://dotblog-cms.netlify.app',
            'https://dotblog.netlify.app',
        ],
        credentials: true,
        exposedHeaders: 'Authorization',
    })
);

app.use('/auth', authRouter);
app.use('/posts', postRouter);
app.use('/users', userRouter);
app.use('/comments', commentRouter);

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
