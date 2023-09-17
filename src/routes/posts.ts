import { Request, Response, Router } from 'express';
import * as postsController from '../controllers/posts_controller';

export const postsRouter = Router();

postsRouter.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts get' });
});

postsRouter.get('/:postID', (req: Request, res: Response): void => {
    res.json({ message: `individual post get ID: ${req.params.postID}` });
});

postsRouter.post('/', postsController.postNewArticle);

postsRouter.put('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts put' });
});

postsRouter.delete('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts delete' });
});
