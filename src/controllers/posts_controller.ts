import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { categories, Category, objectFits, Post, PostModel } from '../models/Post';
import expressAsyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { AuthenticatedRequest, cmsOrigins, UNAUTHORIZED } from './auth_controller';

export const INVALID_ID = { message: 'Failed to fetch - invalid ID format' } as const;
export const INVALID_QUERY = { message: 'Failed to fetch - invalid query' } as const;
export const DOES_NOT_EXIST = { message: 'Failed to fetch - no resource with that ID' } as const;

/*
    - GET
*/
export const getAllPosts = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        // Show unpublished posts only if viewing from CMS site
        const filter = cmsOrigins.includes(req.headers.origin!) ? {} : { isPublished: true };

        // Show newest posts first
        const posts = await Post.find(filter)
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

        if (!req.headers.origin) {
            res.status(401).json(UNAUTHORIZED);
            return;
        }

        const post = await Post.findById(req.params.postID).populate('author', 'name -_id').exec();

        if (post) {
            // Prevent showing unpublished posts on main client
            if (!post.isPublished && !cmsOrigins.includes(req.headers.origin)) {
                res.status(403).json(UNAUTHORIZED);
            } else {
                res.json(post);
            }
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

    body('image', 'Image URL must be a valid URL format').optional({ values: 'falsy' }).isURL(),

    body('objectfit', `Image object-fit must be one of: ${objectFits.join(', ')}`)
        .optional()
        .isIn(objectFits),

    body('category', 'Category must be one of the listed options').isIn(categories),

    body('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .customSanitizer(removeDangerousScriptTags)
        .escape(),

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
                imageURL: (req.body.image as string) || undefined,
                objectFit: req.body.objectfit || 'object-contain',
                timestamp: new Date(),
                category: req.body.category as Category,
                text: req.body.text as string,
                commentCount: 0,
                isPublished: !!req.body.publish as boolean,
                isFeatured: false,
            });

            await post.save();

            // So CMS can redirect straight to new post individual page and
            // already have the author name to show
            await post.populate('author', 'name -_id');
            res.status(201).json(post);
        }
    }),
];

/*
    - PUT
*/
export const editPost: FormPOSTHandler = [
    body('title', 'Title must not be empty').trim().notEmpty().escape(),

    body('image', 'Image URL must be a valid URL format').optional({ values: 'falsy' }).isURL(),

    body('objectfit', `Image object-fit must be one of: ${objectFits.join(', ')}`)
        .optional()
        .isIn(objectFits),

    body('category', 'Category must be one of the listed options').isIn(categories),

    body('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .customSanitizer(removeDangerousScriptTags)
        .escape(),

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
            res.status(400).json({
                errors: errors.array(),
            });
        } else {
            const existingPost = await Post.findById(req.params.postID).exec();

            if (!existingPost) {
                res.status(404).json(DOES_NOT_EXIST);
            } else {
                // Only create and store a new post if no errors
                const editedPost = await Post.findByIdAndUpdate(
                    req.params.postID,
                    new Post<PostModel>({
                        _id: existingPost._id,
                        author: existingPost.author,
                        title: req.body.title as string,
                        imageURL: req.body.image || existingPost.imageURL,
                        objectFit: req.body.objectfit || existingPost.objectFit,
                        timestamp: existingPost.timestamp,
                        category: req.body.category as Category,
                        text: req.body.text as string,
                        commentCount: existingPost.commentCount,
                        isPublished: !!req.body.publish,
                        isFeatured: existingPost.isFeatured,
                    }),
                    {
                        new: true,
                    }
                ).populate('author', 'name -_id');

                res.json(editedPost);
            }
        }
    }),
];

/*
    - PATCH
*/
export const toggleFeaturedPublished = expressAsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(INVALID_ID);
            return;
        }

        const [editedPost, existingFeaturedPosts] = req.query.publish
            ? await togglePublish(req)
            : await toggleFeature(req);

        if (!editedPost) {
            res.status(404).json(DOES_NOT_EXIST);
        } else {
            res.json({ editedPost, existingFeaturedPosts });
        }
    }
);

const togglePublish = async (req: Request): Promise<Array<PostModel | null>> => {
    const editedPost = await Post.findByIdAndUpdate(
        req.params.postID,
        { isPublished: req.query.publish === 'true' },
        { new: true }
    )
        .populate('author', 'name -_id')
        .exec();

    if (editedPost) {
        return [editedPost, null];
    } else {
        return [null, null];
    }
};

const toggleFeature = async (req: Request): Promise<Array<PostModel | PostModel[] | null>> => {
    const [editedPost, existingFeaturedPosts] = await Promise.all([
        Post.findByIdAndUpdate(
            req.params.postID,
            { isFeatured: req.query.feature === 'true' },
            { new: true }
        )
            .populate('author', 'name -_id')
            .exec(),
        Post.find({ _id: { $ne: req.params.postID }, isFeatured: true }).exec(),
    ]);

    if (!editedPost) {
        return [null, null];
    } else if (req.query.feature === 'true') {
        return [editedPost, existingFeaturedPosts];
    } else {
        return [editedPost, null];
    }
};

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

export function removeDangerousScriptTags(text: string): string {
    return text.replaceAll(/(<script>)|(<\/script>)|(?<=<script>)(.|\[^.])*(?=<\/script>)/g, '\n');
}
