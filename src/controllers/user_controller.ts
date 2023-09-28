import { NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { FontColour, User } from '../models/User';
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
        if (!req.query.username) {
            next();
            return;
        }

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
        if (!req.query.avatar) {
            next();
            return;
        } else if (!/^[0-9A-F]{6}$/.test(req.query.avatar as string)) {
            res.status(400).json(INVALID_QUERY);
            return;
        }

        const colour = `#${req.query.avatar}`;
        const fontColour: FontColour = shouldMakeDark(colour) ? '#2A2A27' : '#FAFAFA';

        await User.findByIdAndUpdate(req.params.userID, {
            avatar: colour,
            fontColour: fontColour,
        }).exec();

        const request = req as AuthenticatedRequest;
        request.avatar = colour;
        request.fontColour = fontColour;
        next();
    }
);

const deleteUser = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const deletedUser = User.findByIdAndDelete(req.params.userID).exec();

        if (!deletedUser) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            next();
        }
    }
);

function shouldMakeDark(colour: string): boolean {
    const red = parseInt(colour.slice(0, 2), 16);
    const green = parseInt(colour.slice(2, 4), 16);
    const blue = parseInt(colour.slice(4), 16);

    return red * 0.299 + green * 0.587 + blue * 0.114 > 155;
}

export { toggleBookmark, changeUsername, changeAvatarColour, deleteUser };
