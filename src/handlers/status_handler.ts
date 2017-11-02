import { Request, Response} from 'express';

export default class StatusHandler {
  public async status(req: Request , res: Response): Promise<void> {
    res.send('Ok');
  }
}
