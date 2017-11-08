import * as AWS from 'aws-sdk';
import { NextFunction, Response } from 'express';
import * as _ from 'lodash';
import * as uuid from 'uuid';

import createLogger from '../lib/logger';
import BaseDAO, { ISchema } from './base';

const LOG = createLogger('AuthProvider');

export interface IDiscordUserDetails extends ISchema {
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

export class UsersDAO extends BaseDAO<IDiscordUserDetails> {
  constructor(dynamoDB: AWS.DynamoDB) {
    super('DiscordRelay.DiscordUsers', dynamoDB);
  }

  public async addUser(authDetails: IOAuthTokens, userDetails: IDiscordUserDetails): Promise<IDiscordUser> {
    // Try to find an existing user first.
    const existingUser = await this.getUserWithDiscordId(userDetails.id);

    let userId = uuid.v4();
    if (existingUser) {
      // Ensure the user gets updated.
      userId = existingUser.userId;
    }

    await this.dynamoDB.putItem({
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
          S: userId,
        },
        username: {
          S: userDetails.username,
        },
      },
      TableName: this.tableName,
    }, undefined).promise();

    return {
      email: userDetails.email,
      userId,
      username: userDetails.username,
    };
  }

  private async getUserWithDiscordId(discordUserId: string): Promise<IDiscordUser | null> {
    LOG.info(`Looing up user with discordUserId ${discordUserId}`);
    const result = await this.dynamoDB.scan({
      ExpressionAttributeValues: {
        ':duid': {
          S: discordUserId,
        },
      },
      FilterExpression: 'discordUserId = :duid',
      Select: 'ALL_ATTRIBUTES',
      TableName: this.tableName,
    }, undefined).promise();

    if (!result.Items || !result.Items.length) {
      return null;
    }

    return {
      // This typecasting is bullshit.
      email: result.Items[0].email.S as string,
      userId: result.Items[0].userId.S as string,
      username: result.Items[0].username.S as string,
    };
  }

  public async getUser(userId: string): Promise<IDiscordUser | null> {
    if (!userId) {
      return null;
    }

    const result = await this.dynamoDB.query({
      ExpressionAttributeValues: {
        ':uid': {
          S: userId,
        },
      },
      KeyConditionExpression: 'userId = :uid',
      Select: 'ALL_ATTRIBUTES',
      TableName: this.tableName,
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
