import { NextFunction, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Comment, CommentModel } from '../models/Comment';
import { INVALID_ID, DOES_NOT_EXIST, removeDangerousScriptTags } from './posts_controller';
import { Post } from '../models/Post';
import { deepPopulateFromLevelOne, deepPopulateFromLevelTwo } from '../population/populate_options';

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
        ...(req.params.postID && { post: req.params.postID, isReply: false }),
        ...(req.params.readerID && { commenter: req.params.readerID }),
    };

    // get all comments and 2 levels of replies
    // (default view - user can manually expand to fetch further comment levels)
    const allComments = await Comment.find(searchFilter)
        .populate('commenter', 'username avatar fontColour -_id')
        .populate(deepPopulateFromLevelOne)
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

const getCommentReplies = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.commentID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const commentWithReplies = await Comment.findById(req.params.commentID)
            .populate('commenter', 'username avatar fontColour -_id')
            .populate(deepPopulateFromLevelTwo)
            .exec();

        if (!commentWithReplies) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            res.json(commentWithReplies);
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
            res.status(400).json({
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
                isReply: !!req.query.parent,
            });

            const [savedComment, updatedPost] = await Promise.all([
                comment.save(),
                Post.findOneAndUpdate(
                    { _id: req.params.postID },
                    { $inc: { commentCount: 1 } },
                    { new: true }
                ).exec(),
            ]);

            // If new comment is a reply to another comment, push its _id to the parent's replies array
            if (req.query.parent) {
                const [commentRepliedOn] = await Promise.all([
                    Comment.findByIdAndUpdate(
                        req.query.parent,
                        {
                            $push: { replies: savedComment._id },
                        },
                        { new: true }
                    )
                        .populate('commenter', 'username  avatar fontColour -_id')
                        .populate(deepPopulateFromLevelTwo)
                        .exec(),
                    savedComment.populate('commenter', 'username avatar fontColour -_id'),
                ]);

                if (commentRepliedOn) {
                    res.json(commentRepliedOn);
                    return;
                }
            } else {
                await savedComment.populate('commenter', 'username avatar fontColour -_id');

                if (savedComment && updatedPost) {
                    res.json(savedComment);
                    return;
                }
            }

            res.status(500).json(DATABASE_UPDATE_ERROR);
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
                    isReply: existingComment.isReply,
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

    const deletedComment = await Comment.findByIdAndUpdate(
        req.params.commentID,
        {
            text: '',
            deleted: true,
        },
        { new: true }
    )
        .populate('commenter', 'username avatar fontColour -_id')
        .exec();

    if (!deletedComment) {
        res.status(404).json(DOES_NOT_EXIST);
    } else {
        // Retain populate level else cannot display comment details
        if (req.query.level === '1' || req.query.level === '2') {
            await deletedComment.populate(
                req.query.level === '1' ? deepPopulateFromLevelOne : deepPopulateFromLevelTwo
            );
        }

        res.json(deletedComment);
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

// All user comments upon account deletion
const destroyPostComments = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        await Comment.deleteMany({ post: req.params.postID }).exec();

        res.json({ message: 'Post and associated comments deleted' });
    }
);

export {
    getAllComments,
    getSpecificComment,
    getCommentReplies,
    postNewComment,
    editComment,
    deleteComment,
    deleteUserComments,
    destroyPostComments,
};
