import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as autobind from 'protobind';
import * as uuid from 'uuid';

import createLogger from '../lib/logger';
import BaseDAO, { ISchema } from './base';

const LOG = createLogger('DiscordBotsDAO');

export interface ITokenSearchParams {
  userId: string;
}

export interface IToken extends ISchema {
  headers: {
    [key: string]: string,
  };
  method: string;
  token: string;
  tokenId: string;
  webhookUri: string;
  userId: string;
}

// TODO: Build a DAO helper that handles conversion to dynamo DB and back.
export class DiscordBotsDAO extends BaseDAO<IToken> {
  constructor(dynamoDB: AWS.DynamoDB) {
    super('DiscordRelay.BotTokens', dynamoDB, 'tokenId', 'S');
    autobind(this);
  }

  public async getAllTokenHooks(): Promise<IToken[]> {
    // TODO: Typing.
    const tokensResult = await this.dynamoDB.scan({
      TableName: this.tableName,
    }).promise();

    return _.map(tokensResult.Items, this.mapTokenItemToToken);
  }

  public async getToken(tokenId: string): Promise<IToken | null> {
    const result = await this.dynamoDB.getItem({
      Key: {
        tokenId: {
          S: tokenId,
        },
      },
      TableName: this.tableName,
    }, undefined).promise();

    if (!result.Item) {
      return null;
    }

    return this.mapTokenItemToToken(result.Item);
  }

  public async deleteToken(tokenId: string): Promise<void> {
    await this.dynamoDB.deleteItem({
      Key: {
        tokenId: {
          S: tokenId,
        },
      },
      TableName: this.tableName,
    }, undefined).promise();
  }

  public async findTokens(searchParams: ITokenSearchParams): Promise<IToken[]> {
    const result =  await this.dynamoDB.scan({
      ExpressionAttributeValues: {
        ':uid': {
          S: searchParams.userId,
        },
      },
      FilterExpression: 'userId = :uid',
      TableName: this.tableName,
    }).promise();

    return _.map(result.Items, this.mapTokenItemToToken);
  }

  /**
   * Returns null if the token already exists.
   */
  public async addToken(
    token: string,
    userId: string,
    webhookUri: string,
    method: string,
    headers: Array<[string, string]>,
  ): Promise<IToken | null> {
    // Check for an existing one.
    const existingToken = await this.findToken(token);
    if (existingToken) {
      return null;
    }

    const tokenId = uuid.v4();
    // TODO: Encrypt the token.
    LOG.info(`Saving token ${_.truncate(token, { length: 10 })} with webhook ${webhookUri}`);
    await this.dynamoDB.putItem({
      Item: {
        headers: {
          L: _.map(headers, header => ({ L: _.map(header, headerVal => ({S: headerVal })) })),
        },
        method: {
          S: method,
        },
        tokenId: {
          S: tokenId,
        },
        tokenString: {
          S: token,
        },
        userId: {
          S: userId,
        },
        webhookUri: {
          S: webhookUri,
        },
      },
      TableName: this.tableName,
    }, undefined).promise();

    const parsedHeaders = _.merge({},
      ..._.map(headers, header => ({ [header[0]]: header[1] })),
    );

    return {
      headers: parsedHeaders,
      method,
      token,
      tokenId,
      userId,
      webhookUri,
    };
  }

  private async findToken(token: string): Promise<IToken | null> {
    const result = await this.dynamoDB.scan({
      ExpressionAttributeValues: {
        ':tok': {
          S: token,
        },
      },
      FilterExpression: 'tokenString = :tok',
      TableName: this.tableName,
    }, undefined).promise();

    if (!_.get(result.Items, 'length')) {
      return null;
    }

    return this.mapTokenItemToToken(_.get(result.Items, '0'));
  }

  private mapTokenItemToToken(item: { [key: string]: AWS.DynamoDB.AttributeValue }): IToken {
    const headers = _.merge({},
      ..._.map(item.headers.L, (header: any) => ({ [header.L[0].S as string]: header.L[1].S as string })),
    );
    return {
      headers,
      method: item.method.S as string,
      token: item.tokenString.S as string,
      tokenId: item.tokenId.S as string,
      userId: item.userId.S as string,
      webhookUri: item.webhookUri.S as string,
    };
  }

}
