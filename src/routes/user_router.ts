import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';
import * as commentsController from '../controllers/comments_controller';
import * as userController from '../controllers/user_controller';
import * as authController from '../controllers/auth_controller';

export const userRouter = Router();

/*
    - Handle user-specific resources
*/
userRouter.get(
    '/:userID/bookmarks',
    authController.authenticateJWT,
    postsController.getBookmarkedPosts
);

userRouter.get('/:userID/comments', commentsController.getAllComments);

/*
    - Handle user details
*/
// Refresh after patching bookmark to update cookies with updated bookmark data (else refreshing
// the site will load the outdated bookmark data into state)
userRouter.patch(
    '/:userID',
    authController.authenticateJWT,
    userController.toggleBookmark,
    authController.refreshAccessToken
);

userRouter.put(
    '/:userID',
    authController.authenticateJWT,
    authController.authenticateSameUser,
    userController.changeUsername,
    userController.changeAvatarColour,
    authController.refreshAccessToken
);

userRouter.delete(
    '/:userID',
    authController.authenticateJWT,
    authController.authenticateSameUser,
    userController.deleteUser,
    commentsController.deleteUserComments,
    authController.logout
);
