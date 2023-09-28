import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';
import * as commentsController from '../controllers/comments_controller';

import * as authController from '../controllers/auth_controller';

export const postRouter = Router();

/*
    - Handle posts
*/
postRouter.get('/', postsController.getAllPosts);

postRouter.get('/:postID', postsController.getSpecificPost);

postRouter.post(
    '/',
    authController.authenticateJWT,
    authController.authenticateAuthor,
    postsController.postNewPost
);

postRouter.put(
    '/:postID',
    authController.authenticateJWT,
    authController.authenticateAuthor,
    postsController.editPost
);

// For setting an unpublished post to published only
postRouter.patch(
    '/:postID',
    authController.authenticateJWT,
    authController.authenticateAuthor,
    postsController.toggleFeaturedPublished
);

postRouter.delete(
    '/:postID',
    authController.authenticateJWT,
    authController.authenticateAuthor,
    postsController.deletePost
);

/*
    - Handle comments on a post
*/
postRouter.get('/:postID/comments', commentsController.getAllComments);

postRouter.post(
    '/:postID/comments',
    authController.authenticateJWT,
    commentsController.postNewComment
);
