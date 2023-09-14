import { Request, Response, Router } from 'express';
// import * as indexController from '../controllers/index_controller';

export const indexRouter = Router();

indexRouter.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'index get' });
});

indexRouter.post('/', (req: Request, res: Response): void => {
    res.json({ message: 'index post' });
});

indexRouter.put('/', (req: Request, res: Response): void => {
    res.json({ message: 'index put' });
});

indexRouter.delete('/', (req: Request, res: Response): void => {
    res.json({ message: 'index delete' });
});
