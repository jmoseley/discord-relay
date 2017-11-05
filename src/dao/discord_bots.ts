import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as autobind from 'protobind';
import * as uuid from 'uuid';

import createLogger from '../lib/logger';

const LOG = createLogger('DiscordBotsDAO');

const TABLE_NAME = 'DiscordRelay.BotTokens';

export interface ITokenSearchParams {
  userId: string;
}

export interface IToken {
  token: string;
  tokenId: string;
  webhookUrl: string;
  userId: string;
}

// TODO: Build a DAO helper that handles conversion to dynamo DB and back.
export class DiscordBotsDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {
    autobind(this);
  }

  public async getAllTokenHooks(): Promise<IToken[]> {
    // TODO: Typing.
    const tokensResult = await this.dynamoDB.scan({
      TableName: TABLE_NAME,
    }).promise();

    return _.map(tokensResult.Items, this.mapTokenItemToToken);
  }

  public async findTokens(searchParams: ITokenSearchParams): Promise<IToken[]> {
    const result =  await this.dynamoDB.scan({
      ExpressionAttributeValues: {
        ':uid': {
          S: searchParams.userId,
        },
      },
      FilterExpression: 'userId = :uid',
      TableName: TABLE_NAME,
    }).promise();

    return _.map(result.Items, this.mapTokenItemToToken);
  }

  public async addToken(token: string, webhookUrl: string, userId: string): Promise<void> {
    // Check for an existing one.
    const existingToken = await this.findToken(token);
    if (existingToken) {
      return;
    }

    const tokenId = uuid.v4();
    // TODO: Encrypt the token.
    LOG.info(`Saving token ${_.truncate(token, { length: 10 })} with webhook ${webhookUrl}`);
    await this.dynamoDB.putItem({
      Item: {
       token: {
         S: token,
       },
       tokenId: {
         S: tokenId,
       },
       userId: {
         S: userId,
       },
       webhookUrl: {
         S: webhookUrl,
       },
      },
      TableName: TABLE_NAME,
    }, undefined).promise();
  }

  private async findToken(token: string): Promise<IToken | null> {
    const result = await this.dynamoDB.scan({
      ExpressionAttributeValues: {
        ':tok': {
          S: token,
        },
      },
      FilterExpression: 'token = :tok',
      TableName: TABLE_NAME,
    }, undefined).promise();

    if (!_.get(result.Items, 'length')) {
      return null;
    }

    return this.mapTokenItemToToken(_.get(result.Items, '0'));
  }

  private mapTokenItemToToken(item: { [key: string]: AWS.DynamoDB.AttributeValue }): IToken {
    return {
      token: item.token.S as string,
      tokenId: item.tokenId.S as string,
      userId: item.userId.S as string,
      webhookUrl: item.webhookUrl.S as string,
    };
  }

}
