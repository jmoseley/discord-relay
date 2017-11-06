import * as AWS from 'aws-sdk';
import * as Discord from 'discord.js';
import * as uuid from 'uuid';

import { IToken } from './discord_bots';

const TABLE_NAME = 'DiscordRelay.Messages';

export class DiscordMessageDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {}

  public async persistMessage(
    token: IToken,
    message: Discord.Message,
  ): Promise<void> {
    const messageId = uuid.v4();

    await this.dynamoDB.putItem({
      Item: {
        authorId: {
          S: message.author.id,
        },
        authorUsername: {
          S: message.author.username,
        },
        channelId: {
          S: message.channel.id,
        },
        content: {
          S: message.content,
        },
        messageId: {
          S: messageId,
        },
        timestamp: {
          N: message.createdTimestamp.toString(),
        },
        tokenId: {
          S: token.tokenId,
        },
      },
      TableName: TABLE_NAME,
    }, undefined).promise();
  }
}
