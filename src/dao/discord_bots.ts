import * as AWS from 'aws-sdk';

export class DiscordBotsDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {}

  public async getAllBotTokens(): Promise<string[]> {
    return [];
  }
}
