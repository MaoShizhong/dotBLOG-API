import { Request, Response, Router } from 'express';
// import * as authorController from '../controllers/author_controller';

export const authorRouter = Router();

authorRouter.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'author get' });
});

authorRouter.post('/', (req: Request, res: Response): void => {
    res.json({ message: 'author post' });
});

authorRouter.put('/', (req: Request, res: Response): void => {
    res.json({ message: 'author put' });
});

authorRouter.delete('/', (req: Request, res: Response): void => {
    res.json({ message: 'author delete' });
});
