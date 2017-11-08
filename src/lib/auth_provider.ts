import * as AWS from 'aws-sdk';
import { NextFunction, Response } from 'express';
import * as _ from 'lodash';
import * as uuid from 'uuid';

import { UsersDAO } from '../dao';
import createLogger from './logger';

const LOG = createLogger('AuthProvider');

// This is all users....
const TABLE_NAME = 'DiscordRelay.DiscordUsers';

export interface IDiscordUserDetails {
  username: string;
  id: string;
  email: string;
  verified: boolean;
}

export interface IDiscordUser {
  username: string;
  email: string;
  userId: string;
}

export interface IOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// TODO: Consolidate logic for Discord OAuth and this logic.
export default class AuthProvider {
  constructor(private readonly usersDAO: UsersDAO) {}

  public middleware() {
    // Req is a Request, but need to use any so we can assign stuff to it.
    return (req: any, response: Response, next: NextFunction) => {
      const userId = _.get(req.signedCookies, 'userId');
      this.usersDAO.getUser(userId).then(user => {
        req.user = user;
        next();
      }).catch((err: any) => {
        next(err);
      });
    };
  }
}
