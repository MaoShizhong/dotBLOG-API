import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';
import * as commentsController from '../controllers/comments_controller';
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

resourceRouter.get('/readers/:readerID/comments', commentsController.getAllComments);

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
