import { Router } from 'express';
import * as authController from '../controllers/auth_controller';

export const authRouter = Router();

/*
    - Handle user creation
*/
authRouter.post('/signup', authController.createNewUser);

/*
    - Handle login
*/
authRouter.post('/login', authController.login);

authRouter.get('/logout', authController.logout);

/*
    - Handle JWTs
*/
authRouter.post('/refresh', authController.refreshAccessToken);
