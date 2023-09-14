import { Request, Response, Router } from 'express';
// import * as postsController from '../controllers/posts_controller';

export const postsRouter = Router();

postsRouter.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts get' });
});

postsRouter.post('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts post' });
});

postsRouter.put('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts put' });
});

postsRouter.delete('/', (req: Request, res: Response): void => {
    res.json({ message: 'posts delete' });
});
