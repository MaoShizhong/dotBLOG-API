import { Router } from 'express';
import * as commentsController from '../controllers/comments_controller';
import * as authController from '../controllers/auth_controller';

export const commentRouter = Router();

/*
    - Handle specfic comments
*/
commentRouter.get('/:commentID', commentsController.getSpecificComment);

commentRouter.get('/:commentID/replies', commentsController.getCommentReplies);

commentRouter.put(
    '/:commentID',
    authController.authenticateJWT,
    authController.authenticateSameCommenter,
    commentsController.editComment
);

commentRouter.delete(
    '/:commentID',
    authController.authenticateJWT,
    authController.authenticateSameCommenter,
    commentsController.deleteComment
);
