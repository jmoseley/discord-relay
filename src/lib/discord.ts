import * as Discord from 'discord.js';
import * as _ from 'lodash';
import * as request from 'request-promise-native';
import * as url from 'url';
import * as uuid from 'uuid';

import createLogger, { Logger } from './logger';

export default class DiscordMessageHandler {
  private discordClient: Discord.Client;
  private log: Logger;

  constructor(private readonly token: string, private readonly webhookUrl: string) {
    this.log = createLogger(`DiscordMessageHandler(${token})`);
    this.discordClient = new Discord.Client();

    this.configureClient();
  }

  public async start() {
    await this.discordClient.login(this.token);
  }

  private configureClient(): void {
    this.discordClient.on('ready', () => {
      this.log.info(`Discord Client is ready.`);
    });

    this.discordClient.on('message', (message: string) => {
      // Message isn't actually a string yet.
      message = message.toString();
      const messageId = uuid.v4();

      this.log.info(`${messageId}: Triggering webhook for message '${message}' to '${this.webhookUrl}'`);

      const updatedUrl = this.appendMessageToUrl(this.webhookUrl, message, messageId);

      // Don't use await since the on handler dosen't support it.
      request.get({
        url: updatedUrl,
      }).then(() => {
        this.log.info(`${messageId}: Finished calling webhook.`);
      }).catch((err: any) => {
        this.log.error(`${messageId}: Error handling webhook:\nWebhook URL: ${updatedUrl}\nError:\n${err}`);
      });
    });
  }

  private appendMessageToUrl(urlString: string, message: string, messageId: string): string {
    const parsedUrl = url.parse(urlString, true);
    parsedUrl.query.message = message;
    parsedUrl.query.messageId = messageId;
    // Re-render the query params.
    delete parsedUrl.search;

    return url.format(parsedUrl);
  }
}
