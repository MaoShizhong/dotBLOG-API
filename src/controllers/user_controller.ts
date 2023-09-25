import { NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { User } from '../models/User';
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

export { toggleBookmark };
