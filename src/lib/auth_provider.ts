import * as AWS from 'aws-sdk';
import { NextFunction, Request, Response } from 'express';
import * as uuid from 'uuid';

import createLogger from './logger';

const LOG = createLogger('AuthProvider');

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
// Woah woah, why dosen't this have a DAO!?!
export default class AuthProvider {
  constructor(private readonly dynamoDb: AWS.DynamoDB) {}

  public middleware() {
    return (req: Request, response: Response, next: NextFunction) => {
      LOG.info(`AuthMiddle`);
      next();
    };
  }

  public async getDiscordUser(userDetails: IDiscordUser): Promise<IDiscordUser | null> {
    return null;
  }

  public async createDiscordUser(authDetails: IOAuthTokens, userDetails: IDiscordUserDetails): Promise<IDiscordUser> {
    const newUserId = uuid.v4();

    await this.dynamoDb.putItem({
      Item: {
        accessToken: {
          S: authDetails.accessToken,
        },
        discordUserId: {
          S: userDetails.id,
        },
        email: {
          S: userDetails.email,
        },
        expiresAt: {
          S: authDetails.expiresAt.toISOString(),
        },
        refreshToken: {
          S: authDetails.refreshToken,
        },
        userId: {
          S: newUserId,
        },
      },
      TableName: TABLE_NAME,
    }, undefined).promise();

    return {
      email: userDetails.email,
      userId: newUserId,
      username: userDetails.username,
    };
  }
}
