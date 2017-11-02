import * as AWS from 'aws-sdk';

const TABLE_NME = 'DiscordRelay.Bots';

export class DiscordBotsDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {}

  public async getAllBotTokens(): Promise<string[]> {
    return [];
  }
}
