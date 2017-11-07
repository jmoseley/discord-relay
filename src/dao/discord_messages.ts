import * as AWS from 'aws-sdk';
import * as Discord from 'discord.js';
import * as _ from 'lodash';
import * as uuid from 'uuid';

import createLogger from '../lib/logger';
import { IToken } from './discord_bots';

const LOG = createLogger('DiscordMessageDAO');

const TABLE_NAME = 'DiscordRelay.Messages';

export interface IMessage {
  authorId: string;
  authorUsername: string;
  channelId: string;
  messageId: string;
  timestamp: number;
  tokenId: string;
}

export enum MessageType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}

export class DiscordMessageDAO {
  constructor(private readonly dynamoDB: AWS.DynamoDB) {}

  public async persistMessage(
    token: IToken,
    message: {
      author: {
        id: string;
        username: string;
      },
      channel: {
        id: string,
      },
      createdTimestamp: number,
    },
    type: MessageType,
    sourceMessageId?: string,
  ): Promise<string> {
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
        messageId: {
          S: messageId,
        },
        messageType: {
          S: type,
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

    return messageId;
  }

  public async getMessagesForToken(tokenId: string): Promise<IMessage[]> {
    const results = await this.dynamoDB.query({
      ExpressionAttributeValues: {
        ':tokid': {
          S: tokenId,
        },
      },
      KeyConditionExpression: 'tokenId = :tokid',
      TableName: TABLE_NAME,
    }, undefined).promise();

    return _.map(results.Items, this.mapItemToMessage);
  }

  private mapItemToMessage(
    item: { [key: string]: AWS.DynamoDB.AttributeValue },
  ): IMessage {
    LOG.info(JSON.stringify(item, null, 2));
    return {
      authorId: item.authorId.S as string,
      authorUsername: item.authorUsername.S as string,
      channelId: item.channelId.S as string,
      messageId: item.messageId.S as string,
      timestamp: parseInt(item.timestamp.N as string, 10),
      tokenId: item.tokenId.S as string,
    };
  }
}
