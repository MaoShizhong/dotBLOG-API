import { NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { Colour, User, colours } from '../models/User';
import { DOES_NOT_EXIST, INVALID_ID, INVALID_QUERY } from './posts_controller';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from './auth_controller';

const toggleBookmark = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const user = await User.findById(req.params.userID).exec();

        // guard clauses
        if (!user) {
            res.status(404).json(DOES_NOT_EXIST);
            return;
        } else if (!req.query.post || !req.query.bookmark) {
            res.status(400).json(INVALID_QUERY);
            return;
        } else if (!Types.ObjectId.isValid(req.query.post as string)) {
            res.status(400).json(INVALID_ID);
        }

        // actual action if validated
        if (req.query.bookmark === 'true') {
            user.bookmarks.push(new Types.ObjectId(req.query.post as string));
        } else {
            user.bookmarks = user.bookmarks.filter((postID): boolean => {
                return postID.valueOf() !== req.query.post;
            });
        }

        await user.save();
        (req as AuthenticatedRequest).bookmarks = user.bookmarks;
        next();
    }
);

const changeUsername = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.query.username) next();

        const [currentUser, existingUsername] = await Promise.all([
            User.findById(req.params.userID).exec(),
            User.findOne({ username: req.query.username }).exec(),
        ]);

        if (currentUser?.username === req.query.username) {
            next();
        } else if (existingUsername) {
            res.status(403).json({ message: 'Username already taken' });
        } else {
            await User.findByIdAndUpdate(req.params.userID, { username: req.query.username });
            (req as AuthenticatedRequest).username = req.query.username as string;
            next();
        }
    }
);

const changeAvatarColour = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.query.avatar) next();

        const colour = `#${req.query.avatar}`;

        if (!colours.includes(colour as Colour)) {
            console.log(colour);
            res.status(400).json(INVALID_QUERY);
            return;
        }

        await User.findByIdAndUpdate(req.params.userID, { avatar: colour }).exec();

        (req as AuthenticatedRequest).avatar = colour as Colour;
        next();
    }
);

export { toggleBookmark, changeUsername, changeAvatarColour };
