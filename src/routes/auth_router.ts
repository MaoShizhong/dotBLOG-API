import { Router } from 'express';
import * as authController from '../controllers/auth_controller';

export const authRouter = Router();

/*
    - Handle user accounts
*/
authRouter.post(
    '/user',
    authController.createNewUser,
    authController.attemptLogin,
    authController.approveLogin
);

/*
    - Handle login
*/

authRouter.post('/tokens', authController.attemptLogin, authController.approveLogin);

authRouter.delete('/tokens', authController.logout);

/*
    - Handle JWTs
*/
authRouter.put('/tokens', authController.refreshAccessToken);
