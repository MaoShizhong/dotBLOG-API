import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { categories, Category, Post, PostModel } from '../models/Post';
import expressAsyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { AuthenticatedRequest } from './auth_controller';

export const INVALID_ID = { message: 'Failed to fetch - invalid ID format' } as const;
export const INVALID_QUERY = { message: 'Failed to fetch - invalid query' } as const;
export const DOES_NOT_EXIST = { message: 'Failed to fetch - no resource with that ID' } as const;

/*
    - GET
*/
export const getAllPosts = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        // Show newest posts first
        const posts = await Post.find()
            .populate('author', '-_id name username')
            .sort({ timestamp: -1 })
            .exec();

        res.json(posts);
    }
);

// GET INDIVIDUAL POST
export const getSpecificPost = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const post = await Post.findById(req.params.postID).populate('author', 'name -_id').exec();

        if (post) {
            res.json(post);
        } else {
            res.status(404).json(DOES_NOT_EXIST);
        }
    }
);

/*
    - POST
*/
export const postNewPost: FormPOSTHandler = [
    body('title', 'Title must not be empty').trim().notEmpty().escape(),

    body('category', 'Category must be one of the listed options').toLowerCase().isIn(categories),

    body('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer(convertToArrayOfParagraphs),

    /* If not checked, field will not be submitted (undefined) - checking submits a truthy string */
    body('publish')
        .optional({ values: undefined })
        .custom((value: string): boolean => !!value),

    expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(401).json({
                errors: errors.array(),
            });
        } else {
            // Only authorised authors will reach this point
            const author = await User.findOne({
                username: (req as AuthenticatedRequest).username,
            }).exec();

            // Very unlikely safeguard
            if (!author) {
                res.status(404).json({ message: 'Author does not exist ' });
                return;
            }

            const post = new Post<PostModel>({
                author: new Types.ObjectId(author._id),
                title: req.body.title as string,
                timestamp: new Date(),
                category: req.body.category as Category,
                text: req.body.text as string[],
                isPublished: !!req.body.publish as boolean,
            });

            await post.save();
            res.status(201).json({ url: post.url });
        }
    }),
];

/*
    - PUT
*/
export const editPost: FormPOSTHandler = [
    body('title', 'Title must not be empty').optional().trim().notEmpty().escape(),

    body('category', 'Category must be one of the listed options')
        .toLowerCase()
        .optional()
        .isIn(categories),

    body('text', 'Article cannot be empty')
        .optional()
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer((text: string): string[] =>
            // Convert text into array of paragraphs
            text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n')
        ),

    /* If not checked, field will not be submitted (undefined) - checking submits a truthy string */
    body('publish')
        .optional({ values: undefined })
        .custom((value: string): boolean => !!value),

    expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        } else {
            const existingPost = await Post.findById(req.params.postID).exec();

            if (!existingPost) {
                res.status(404).json(DOES_NOT_EXIST);
            } else {
                // Only create and store a new post if no errors
                const postWithEdits = new Post<PostModel>({
                    _id: existingPost._id,
                    author: existingPost.author,
                    title: req.body.title ?? existingPost.title,
                    timestamp: existingPost.timestamp,
                    category: req.body.category ?? existingPost.category,
                    text: req.body.text ?? existingPost.text,
                    isPublished: req.body.publish || existingPost.isPublished,
                });

                const editedPost = await Post.findByIdAndUpdate(req.params.postID, postWithEdits, {
                    new: true,
                });

                res.json(editedPost);
            }
        }
    }),
];

/*
    - PATCH
*/
export const publishPost = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (
            !Types.ObjectId.isValid(req.params.postID) ||
            !['true', 'false'].includes(req.query.publish as string)
        ) {
            const message = !Types.ObjectId.isValid(req.params.postID) ? INVALID_ID : INVALID_QUERY;

            res.status(400).json(message);
            return;
        }

        const editedPost = await Post.findByIdAndUpdate(
            req.params.postID,
            { isPublished: req.query.publish === 'true' },
            { new: true }
        )
            .populate('author', 'name -_id')
            .exec();

        if (!editedPost) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            res.json(editedPost);
        }
    }
);

/*
    - DELETE
*/
export const deletePost = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const deletedPost = await Post.findByIdAndDelete(req.params.postID).exec();

        if (!deletedPost) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            res.status(204).json(deletedPost);
        }
    }
);

export function convertToArrayOfParagraphs(text: string): string[] {
    // Convert text into array of paragraphs
    return text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n');
}
