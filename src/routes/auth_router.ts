import { Router } from 'express';
import * as authController from '../controllers/auth_controller';

export const authRouter = Router();

/*
    - Handle user accounts
*/
authRouter.post(
    '/signup',
    authController.createNewUser,
    authController.attemptLogin,
    authController.approveLogin
);

/*
    - Handle login
*/

authRouter.post('/login', authController.attemptLogin, authController.approveLogin);

authRouter.get('/logout', authController.logout);

/*
    - Handle JWTs
*/
authRouter.get('/refresh', authController.refreshAccessToken);
