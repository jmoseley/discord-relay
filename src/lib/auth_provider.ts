import { NextFunction, Request, Response } from 'express';

import createLogger from './logger';

const LOG = createLogger('AuthProvider');

// TODO: Consolidate logic for Discord OAuth and this logic.
export default class AuthProvider {
  public middleware() {
    return (req: Request, response: Response, next: NextFunction) => {
      LOG.info(`AuthMiddle`);
      next();
    };
  }
}
