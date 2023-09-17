import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';

export const postsRouter = Router();

postsRouter.get('/', postsController.getAllPosts);

postsRouter.get('/:postID', postsController.getSpecificPost);

postsRouter.post('/', postsController.postNewPost);

postsRouter.put('/:postID', postsController.editPost);

postsRouter.delete('/:postID', postsController.deletePost);
