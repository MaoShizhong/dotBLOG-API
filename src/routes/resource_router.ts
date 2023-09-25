import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';
import * as commentsController from '../controllers/comments_controller';
import * as userController from '../controllers/user_controller';
import { refreshAccessToken } from '../controllers/auth_controller';
import { authJWT, authAuthor, authCommenter } from '../controllers/auth_controller';

export const resourceRouter = Router();

/*
    - Handle posts
*/
resourceRouter.get('/posts', postsController.getAllPosts);

resourceRouter.get('/posts/:postID', postsController.getSpecificPost);

resourceRouter.post('/posts', authJWT, authAuthor, postsController.postNewPost);

resourceRouter.put('/posts/:postID', authJWT, authAuthor, postsController.editPost);

// For setting an unpublished post to published only
resourceRouter.patch(
    '/posts/:postID',
    authJWT,
    authAuthor,
    postsController.toggleFeaturedPublished
);

resourceRouter.delete('/posts/:postID', authJWT, authAuthor, postsController.deletePost);

/*
    - Handle comments
*/
resourceRouter.get('/posts/:postID/comments', commentsController.getAllComments);

resourceRouter.get('/users/:userID/comments', commentsController.getAllComments);

resourceRouter.post(
    '/posts/:postID/comments',
    authJWT,
    authCommenter,
    commentsController.postNewComment
);

resourceRouter.get('/comments/:commentID', commentsController.getSpecificComment);

resourceRouter.put('/comments/:commentID', authJWT, authCommenter, commentsController.editComment);

resourceRouter.delete(
    '/comments/:commentID',
    authJWT,
    authCommenter,
    commentsController.deleteComment
);

/*
    - Handle user edit/delete
*/
// Refresh after patching bookmark to update cookies with updated bookmark data (else refreshing
// the site will load the outdated bookmark data into state)
resourceRouter.patch('/users/:userID', authJWT, userController.toggleBookmark, refreshAccessToken);
