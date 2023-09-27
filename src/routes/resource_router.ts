import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';
import * as commentsController from '../controllers/comments_controller';
import * as userController from '../controllers/user_controller';
import { authenticateSameUser, refreshAccessToken } from '../controllers/auth_controller';
import {
    authenticateJWT,
    authenticateAuthor,
    authenticateCommenter,
    logout,
} from '../controllers/auth_controller';

export const resourceRouter = Router();

/*
    - Handle posts
*/
resourceRouter.get('/posts', postsController.getAllPosts);

resourceRouter.get('/posts/:postID', postsController.getSpecificPost);

resourceRouter.get('/users/:userID/bookmarks', authenticateJWT, postsController.getBookmarkedPosts);

resourceRouter.post('/posts', authenticateJWT, authenticateAuthor, postsController.postNewPost);

resourceRouter.put('/posts/:postID', authenticateJWT, authenticateAuthor, postsController.editPost);

// For setting an unpublished post to published only
resourceRouter.patch(
    '/posts/:postID',
    authenticateJWT,
    authenticateAuthor,
    postsController.toggleFeaturedPublished
);

resourceRouter.delete(
    '/posts/:postID',
    authenticateJWT,
    authenticateAuthor,
    postsController.deletePost
);

/*
    - Handle comments
*/
resourceRouter.get('/posts/:postID/comments', commentsController.getAllComments);

resourceRouter.get('/users/:userID/comments', commentsController.getAllComments);

resourceRouter.post('/posts/:postID/comments', authenticateJWT, commentsController.postNewComment);

resourceRouter.get('/comments/:commentID', commentsController.getSpecificComment);

resourceRouter.put(
    '/comments/:commentID',
    authenticateJWT,
    authenticateCommenter,
    commentsController.editComment
);

resourceRouter.delete(
    '/comments/:commentID',
    authenticateJWT,
    authenticateCommenter,
    commentsController.deleteComment
);

/*
    - Handle user edit/delete
*/
// Refresh after patching bookmark to update cookies with updated bookmark data (else refreshing
// the site will load the outdated bookmark data into state)
resourceRouter.patch(
    '/users/:userID',
    authenticateJWT,
    userController.toggleBookmark,
    refreshAccessToken
);

resourceRouter.put(
    '/users/:userID',
    authenticateJWT,
    authenticateSameUser,
    userController.changeUsername,
    userController.changeAvatarColour,
    refreshAccessToken
);

resourceRouter.delete(
    '/users/:userID',
    authenticateJWT,
    authenticateSameUser,
    userController.deleteUser,
    commentsController.deleteUserComments,
    logout
);
