import * as Discord from 'discord.js';
import * as _ from 'lodash';
import * as request from 'request-promise-native';
import * as url from 'url';
import * as uuid from 'uuid';

import { IToken } from '../actions/discord';
import { DiscordMessageDAO, MessageType } from '../dao';
import createLogger, { Logger } from './logger';

export default class DiscordMessageHandler {
  private discordClient: Discord.Client;
  private log: Logger;

  constructor(
    private readonly discordMessageDao: DiscordMessageDAO,
    public readonly token: IToken,
  ) {
    this.log = createLogger(`DiscordMessageHandler(${token.token})`);
    this.discordClient = new Discord.Client();

    this.configureClient();
  }

  public async start() {
    await this.discordClient.login(this.token.token);
  }

  public async stop() {
    this.log.info(`Destroying client`);
    await this.discordClient.destroy();
  }

  private handlePresenceUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember) {
    this.log.info(`Triggering webhook for event 'presenceUpdate' to '${this.token.webhookUri}'`);

    const data: any = {
      eventName: 'presenceUpdate',
      gameName: _.get(newMember.presence, 'game.name'),
      id: newMember.user.id,
      oldGameName: _.get(oldMember.presence, 'game.name'),
      oldStatus: oldMember.presence.status,
      status: newMember.presence.status,
      username: newMember.user.username,
    };

    request(this.token.webhookUri, {
      body: this.token.method === 'POST' ? data : undefined,
      headers: this.token.headers,
      json: true,
      method: this.token.method,
      qs: this.token.method === 'GET' ? data : undefined,
    }).then(async response => {
      const messageId = await this.discordMessageDao.persistMessage(
        this.token,
        newMember.user.id,
        newMember.user.username,
        Date.now(),
        MessageType.EVENT,
        undefined,
        'presenceUpdate',
      );
      const outgoingMessage = _.get(response, 'message');
      const sendToChannelId = _.get(response, 'channelId');
      if (outgoingMessage) {
        this.log.info(`Sending response '${outgoingMessage}'.`);
        for (const [channelId, channel] of this.discordClient.channels) {
          if (sendToChannelId && channelId !== sendToChannelId) {
            continue;
          }

          let textChannel: Discord.TextChannel;
          if (channel.type === 'text') {
            textChannel = channel as Discord.TextChannel;
          } else {
            continue;
          }
          // Only do this for guilds that both are a member of.
          if (textChannel.guild.id !== newMember.guild.id) {
            continue;
          }

          await textChannel.send(outgoingMessage);
          await this.discordMessageDao.persistMessage(
            this.token,
            this.discordClient.user.id,
            this.discordClient.user.username,
            Date.now(),
            MessageType.OUTGOING,
            channelId,
            'presenceUpdate',
          );
        }
      }
    });
  }

  private handleMessage(message: Discord.Message) {
    // Do not trigger for messages that this bot sent.
    // Prevents feedback loops.
    if (message.author.id === this.discordClient.user.id) {
      this.log.info(`Dropping message because it came from the bot.`);
      return;
    }

    this.log.info(`Triggering webhook for message '${message.content}' to '${this.token.webhookUri}'`);

    let body: any;
    let qs: any;
    if (this.token.method === 'POST') {
      body = this.getMessageData(message);
    }
    if (this.token.method === 'GET') {
      qs = this.getMessageData(message);
    }

    request(this.token.webhookUri, {
      body,
      headers: this.token.headers,
      json: true,
      method: this.token.method,
      qs,
    }).then(async response => {
      const messageId = await this.discordMessageDao.persistMessage(
        this.token,
        message.author.id,
        message.author.username,
        message.createdTimestamp,
        MessageType.INCOMING,
        message.channel.id,
      );
      const outgoingMessage = _.get(response, 'message');
      if (outgoingMessage) {
        this.log.info(`Sending response '${outgoingMessage}'.`);
        await message.channel.send(outgoingMessage);
        await this.discordMessageDao.persistMessage(
          this.token,
          this.discordClient.user.id,
          this.discordClient.user.username,
          Date.now(),
          MessageType.OUTGOING,
        );
      }
    });
  }

  private configureClient(): void {
    this.discordClient.on('ready', () => {
      this.log.info(`Discord Client is ready.`);
    });

    this.discordClient.on('presenceUpdate', this.handlePresenceUpdate.bind(this));
    this.discordClient.on('message', this.handleMessage.bind(this));
    this.discordClient.on('messageUpdate', (oldMessage: Discord.Message, newMessage: Discord.Message) => {
      this.handleMessage(newMessage);
    });
  }

  private getMessageData(message: Discord.Message): any {
    return {
      authorId: message.author.id,
      authorUsername: message.author.username,
      channelId: message.channel.id,
      createdTimestamp: message.createdTimestamp,
      isMentioned: message.isMentioned(this.discordClient.user.id),
      message: message.content,
    };
  }
}
