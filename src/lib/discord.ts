import * as Discord from 'discord.js';
import * as _ from 'lodash';
import * as request from 'request-promise-native';
import * as url from 'url';
import * as uuid from 'uuid';

import { IToken } from '../actions/discord';
import createLogger, { Logger } from './logger';

export default class DiscordMessageHandler {
  private discordClient: Discord.Client;
  private log: Logger;

  constructor(
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

  private configureClient(): void {
    this.discordClient.on('ready', () => {
      this.log.info(`Discord Client is ready.`);
    });

    this.discordClient.on('message', (message: Discord.Message) => {
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
        method: this.token.method,
        qs,
      });
    });
  }

  private getMessageData(message: Discord.Message): any {
    return {
      author: message.author.username,
      channelId: message.channel.id,
      createdTimestamp: message.createdTimestamp,
      isMentioned: message.isMentioned(this.discordClient.user.id),
      message: message.content,
    };
  }
}
