import * as AWS from 'aws-sdk';
import { NextFunction, Response } from 'express';
import * as _ from 'lodash';
import * as uuid from 'uuid';

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
// Woah woah, why dosen't this have a DAO!?!
export default class AuthProvider {
  constructor(private readonly dynamoDb: AWS.DynamoDB) {}

  public middleware() {
    // Req is a Request, but need to use any so we can assign stuff to it.
    return (req: any, response: Response, next: NextFunction) => {
      const userId = _.get(req.signedCookies, 'userId');
      this.getUser(userId).then(user => {
        req.user = user;
        next();
      }).catch((err: any) => {
        next(err);
      });
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
        username: {
          S: userDetails.username,
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

  private async getUser(userId: string): Promise<IDiscordUser | null> {
    if (!userId) {
      return null;
    }

    const result = await this.dynamoDb.query({
      ExpressionAttributeValues: {
        ':uid': {
          S: userId,
        },
      },
      KeyConditionExpression: 'userId = :uid',
      Select: 'ALL_ATTRIBUTES',
      TableName: TABLE_NAME,
    }, undefined).promise();

    if (!result.Items || !result.Items.length) {
      return null;
    }

    return {
      // This typecasting is bullshit.
      email: result.Items[0].email.S as string,
      userId,
      username: result.Items[0].username.S as string,
    };
  }
}
