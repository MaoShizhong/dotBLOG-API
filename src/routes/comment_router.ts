import { Router } from 'express';
import * as commentsController from '../controllers/comments_controller';
import * as authController from '../controllers/auth_controller';

export const commentRouter = Router();

/*
    - Handle specfic comments
*/
commentRouter.get('/:commentID', commentsController.getSpecificComment);

commentRouter.put(
    '/:commentID',
    authController.authenticateJWT,
    authController.authenticateCommenter,
    commentsController.editComment
);

commentRouter.delete(
    '/:commentID',
    authController.authenticateJWT,
    authController.authenticateCommenter,
    commentsController.deleteComment
);
