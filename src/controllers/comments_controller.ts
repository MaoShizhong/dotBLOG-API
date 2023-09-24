import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Comment, CommentModel } from '../models/Comment';
import { INVALID_ID, DOES_NOT_EXIST, removeDangerousScriptTags } from './posts_controller';

type Query = {
    post?: string;
    commenter?: string;
};

/*
    - GET
*/
export const getAllComments = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const searchFilter: Query = {
            ...(req.params.postID && { post: req.params.postID }),
            ...(req.params.readerID && { commenter: req.params.readerID }),
        };

        const allComments = await Comment.find(searchFilter)
            .populate('commenter')
            .sort({ timestamp: -1 })
            .exec();

        const status = allComments.length ? 200 : 404;

        res.status(status).json(allComments);
    }
);

export const getSpecificComment = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.commentID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const comment = await Comment.findById(req.params.commentID).exec();

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
export const postNewComment: FormPOSTHandler = [
    body('text', 'Comment cannot be empty')
        .trim()
        .notEmpty()
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
                post: new Types.ObjectId(req.query.postID as string),
                timestamp: new Date(),
                text: req.body.text as string,
            });

            await comment.save();
            res.status(201).json(comment);
        }
    }),
];

/*
    - PUT
*/
export const editComment: FormPOSTHandler = [
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
export const deleteComment = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.commentID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const deletedComment = await Comment.findByIdAndDelete(req.params.commentID).exec();

        if (!deletedComment) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            res.status(204).json(deletedComment);
        }
    }
);
