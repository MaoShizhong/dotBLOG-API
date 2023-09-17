import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { categories, Category, Post, PostModel } from '../models/Post';
import expressAsyncHandler from 'express-async-handler';

// POST REQUEST
export const postNewArticle: FormPOSTHandler = [
    body('title', 'Title must not be empty').trim().notEmpty().escape(),

    body('category', 'Category must be one of the listed options').toLowerCase().isIn(categories),

    body('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .escape()
        .customSanitizer((text: string): string[] =>
            // Convert text into array of paragraphs
            text.replaceAll('\r', '').replaceAll(/\n+/g, '\n').split('\n')
        ),

    // Selection will be converted into a boolean, with the default value being false unless the
    // 'yes' option was selected specifically
    body('isPublished')
        .trim()
        .toLowerCase()
        .escape()
        .customSanitizer((selection: string): boolean => selection === 'yes'),

    expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.json({
                errors: errors.array(),
            });
        }

        // Only create and store a new post if no errors
        const post = new Post<PostModel>({
            author: 'Mao', // TODO: to be replaced once JWT auth implemented
            title: req.body.title as string,
            timestamp: new Date(),
            category: req.body.category as Category,
            text: req.body.text as string[],
            published: req.body.isPublished as boolean,
        });

        // await post.save();
        res.json(post);
    }),
];
