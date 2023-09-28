import { NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Comment, CommentModel } from '../models/Comment';
import { INVALID_ID, DOES_NOT_EXIST, removeDangerousScriptTags } from './posts_controller';
import { Post } from '../models/Post';

type Query = {
    post?: string;
    commenter?: string;
};

const DATABASE_UPDATE_ERROR = { message: 'Error updating database' };

/*
    - GET
*/
const getAllComments = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    const searchFilter: Query = {
        ...(req.params.postID && { post: req.params.postID }),
        ...(req.params.readerID && { commenter: req.params.readerID }),
    };

    const allComments = await Comment.find(searchFilter)
        .populate('commenter', 'username avatar fontColour -_id')
        .sort({ timestamp: -1 })
        .exec();

    res.json(allComments);
});

const getSpecificComment = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.commentID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const comment = await Comment.findById(req.params.commentID)
            .populate('commenter', 'username avatar fontColour -_id')
            .exec();

        if (!comment) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            res.json(comment);
        }
    }
);

/*
    - POST
*/
const postNewComment: FormPOSTHandler = [
    body('text', 'Comment cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer(removeDangerousScriptTags),

    expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        } else {
            // Only create and store a new post if no errors
            const comment = new Comment<CommentModel>({
                commenter: new Types.ObjectId(req.query.commenterID as string),
                post: new Types.ObjectId(req.params.postID as string),
                timestamp: new Date(),
                text: req.body.text as string,
                replies: [],
                deleted: false,
            });

            const [savedComment, updatedPost] = await Promise.all([
                comment.save(),
                Post.findOneAndUpdate(
                    { _id: req.params.postID },
                    { $inc: { commentCount: 1 } },
                    { new: true }
                ).exec(),
            ]);

            await savedComment.populate('commenter', 'username avatar fontColour -_id');

            if (savedComment && updatedPost) {
                res.status(201).json(savedComment);
            } else {
                res.status(500).json(DATABASE_UPDATE_ERROR);
            }
        }
    }),
];

/*
    - PUT
*/
const editComment: FormPOSTHandler = [
    body('text', 'Comment cannot be empty')
        .trim()
        .notEmpty()
        .customSanitizer(removeDangerousScriptTags),

    expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.commentID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        } else {
            const existingComment = await Comment.findById(req.params.commentID).exec();

            if (!existingComment) {
                res.status(404).json(DOES_NOT_EXIST);
            } else {
                const commentWithEdits = new Comment<CommentModel>({
                    _id: existingComment._id,
                    commenter: existingComment.commenter,
                    post: existingComment.post,
                    timestamp: existingComment.timestamp,
                    text: req.body.text as string,
                    replies: existingComment.replies,
                    deleted: false,
                });

                const editedComment = await Comment.findByIdAndUpdate(
                    req.params.commentID,
                    commentWithEdits,
                    { new: true }
                );

                res.json(editedComment);
            }
        }
    }),
];

/*
    - DELETE
*/
// Single comment
const deleteComment = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!Types.ObjectId.isValid(req.params.commentID)) {
        res.status(400).json(INVALID_ID);
        return;
    }

    const deletedComment = await Comment.findByIdAndUpdate(req.params.commentID, {
        text: '',
        deleted: true,
    }).exec();

    if (!deletedComment) {
        res.status(404).json(DOES_NOT_EXIST);
    } else {
        res.status(204).json(deletedComment);
    }
});

// All user comments upon account deletion
const deleteUserComments = expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await Comment.updateMany(
            { commenter: req.params.userID },
            { text: '', deleted: true }
        ).exec();

        next();
    }
);

export {
    getAllComments,
    getSpecificComment,
    postNewComment,
    editComment,
    deleteComment,
    deleteUserComments,
};
