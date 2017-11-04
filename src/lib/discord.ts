import * as Discord from 'discord.js';
import * as _ from 'lodash';

import createLogger, { Logger } from './logger';

export default class DiscordMessageHandler {
  private discordClient: Discord.Client;
  private log: Logger;

  constructor(private readonly token: string, private readonly webhookUrl: string) {
    this.log = createLogger(`DiscordMessageHandler(${_.truncate(token, { length: 10 })})`);
    this.discordClient = new Discord.Client();

    this.discordClient.on('ready', () => {
      this.log.info(`Discord Client is ready.`);
    });

    this.discordClient.on('message', (message: string) => {
      this.log.info(`Got a message: '${message}' for token ${_.truncate(this.token, { length: 10 })}`);
    });
  }

  public async start() {
    await this.discordClient.login(this.token);
  }
}
