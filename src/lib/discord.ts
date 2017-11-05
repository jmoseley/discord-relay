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

    this.discordClient.on('message', (message: string) => {
      // Message isn't actually a string yet.
      message = message.toString();
      const messageId = uuid.v4();

      this.log.info(`${messageId}: Triggering webhook for message '${message}' to '${this.token.webhookUri}'`);

      let body: any;
      let qs: any;
      if (this.token.method === 'POST') {
        body = {};
        body.message = message;
        body.messageId = messageId;
      }
      if (this.token.method === 'GET') {
        qs = {};
        qs.message = message;
        qs.messageId = messageId;
      }

      request(this.token.webhookUri, {
        body,
        headers: this.token.headers,
        method: this.token.method,
        qs,
      });
    });
  }
}
