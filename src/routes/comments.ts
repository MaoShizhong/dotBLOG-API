import { Request, Response, Router } from 'express';
// import * as commentsController from '../controllers/comments_controller';

export const commentsRouter = Router();

commentsRouter.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'comments get' });
});

commentsRouter.post('/', (req: Request, res: Response): void => {
    res.json({ message: 'comments post' });
});

commentsRouter.put('/', (req: Request, res: Response): void => {
    res.json({ message: 'comments put' });
});

commentsRouter.delete('/', (req: Request, res: Response): void => {
    res.json({ message: 'comments delete' });
});
