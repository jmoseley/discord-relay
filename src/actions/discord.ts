import * as Discord from 'discord.js';
import * as _ from 'lodash';

import { DiscordBotsDAO } from '../dao';
import createLogger from '../lib/logger';

const LOG = createLogger('DiscordClientActions');

export class DiscordClientActions {
  private activeClients: Discord.Client[];

  constructor(private readonly discordBotDao: DiscordBotsDAO) {}

  // TODO: Move this into a worker.
  public async startPersistedClients(): Promise<void> {
    const clientTokens = await this.discordBotDao.getAllBotTokens();

    this.activeClients = await Promise.all(clientTokens.map(this.startClient));
  }

  public async addClient(token: string): Promise<void> {
    await this.discordBotDao.addToken(token);
    this.activeClients.push(await this.startClient(token));
  }

  // TODO: Move this into a worker.
  private async startClient(token: string): Promise<Discord.Client> {
    const client = new Discord.Client();

    client.on('ready', () => {
      LOG.info(`Discord Client is ready.`);
    });

    client.on('message', (message: string) => {
      LOG.info(`Got a message: ${message} for token ${_.truncate(token, { length: 5 })}`);
    });

    await client.login(token);

    return client;
  }
}
