import * as Discord from 'discord.js';
import * as _ from 'lodash';

import { DiscordBotsDAO } from '../dao';
import createLogger from '../lib/logger';

const LOG = createLogger('DiscordClientActions');

export class DiscordClientActions {
  private activeClients: Discord.Client[];

  constructor(private readonly discordBotDao: DiscordBotsDAO) {
    this.activeClients = [];
  }

  // TODO: Move this into a worker.
  public async startPersistedClients(): Promise<void> {
    const clients = await this.discordBotDao.getAllBotHooks();

    this.activeClients = _.compact(await Promise.all(
      clients.map(client => this.startClient(client.token, client.webhookUrl))));
  }

  public async addClient(token: string, webhookUrl: string): Promise<void> {
    await this.discordBotDao.addToken(token, webhookUrl);
    const client = await this.startClient(token, webhookUrl);
    if (client) {
      this.activeClients.push(client);
    }
  }

  // TODO: Move this into a worker.
  private async startClient(token: string, webhookUrl: string): Promise<Discord.Client | null> {
    LOG.info(`Starting client for token ${_.truncate(token, { length: 10 })}`);
    if (!webhookUrl) {
      LOG.info(`Not starting client for token ` +
        `${_.truncate(token, { length: 10 })} because there is no matching webhook.`);
      return null;
    }
    const client = new Discord.Client();

    client.on('ready', () => {
      LOG.info(`Discord Client is ready.`);
    });

    client.on('message', (message: string) => {
      LOG.info(`Got a message: '${message}' for token ${_.truncate(token, { length: 10 })}`);
    });

    await client.login(token);

    return client;
  }
}
