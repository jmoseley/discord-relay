import * as AWS from 'aws-sdk';
import * as _ from 'lodash';

import createLogger from '../lib/logger';

const LOG = createLogger('DiscordBotsDAO');

const TABLE_NAME = 'DiscordRelay.Bots';

export class DiscordBotsDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {}

  public async getAllBotTokens(): Promise<string[]> {
    return [];
  }

  public async addToken(token: string): Promise<void> {
    LOG.info(`Saving token ${_.truncate(token, { length: 5 })}`);
    await this.dynamoDB.putItem({
      Item: {
       token: {
         S: token,
       },
      },
      TableName: TABLE_NAME,
    }, undefined).promise();
  }
}
