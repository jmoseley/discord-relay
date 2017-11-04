import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as autobind from 'protobind';

import createLogger from '../lib/logger';

const LOG = createLogger('DiscordBotsDAO');

const TABLE_NAME = 'DiscordRelay.Bots';

export class DiscordBotsDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {
    autobind(this);
  }

  public async getAllBotTokens(): Promise<string[]> {
    // TODO: Typing.
    const tokensResult = await this.dynamoDB.scan().promise();

    return _.map(tokensResult.Items, (item: any) => item.token.S);
  }

  public async addToken(token: string): Promise<void> {
    // TODO: Encrypt the token.
    LOG.info(`Saving token ${_.truncate(token, { length: 10 })}`);
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
