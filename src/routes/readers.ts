import { Request, Response, Router } from 'express';
// import * as readersController from '../controllers/readers_controller';

export const readersRouter = Router();

readersRouter.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'readers get' });
});

readersRouter.post('/', (req: Request, res: Response): void => {
    res.json({ message: 'readers post' });
});

readersRouter.put('/', (req: Request, res: Response): void => {
    res.json({ message: 'readers put' });
});

readersRouter.delete('/', (req: Request, res: Response): void => {
    res.json({ message: 'readers delete' });
});
