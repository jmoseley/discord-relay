import * as _ from 'lodash';

import { DiscordBotsDAO } from '../dao';
import DiscordMessageHandler from '../lib/discord';
import createLogger from '../lib/logger';

const LOG = createLogger('DiscordClientActions');

export { IToken } from '../dao';

export const TOKEN_DOES_NOT_EXIST_ERROR = 'TOKEN_DOES_NOT_EXIST';
export const TOKEN_DOES_NOT_BELONG_TO_USER_ERROR = 'TOKEN_DOES_NOT_BELONG_TO_USER';

export class DiscordClientActions {
  private activeClients: DiscordMessageHandler[];

  constructor(private readonly discordTokenDao: DiscordBotsDAO) {
    this.activeClients = [];
  }

  // TODO: Move this into a worker.
  public async startPersistedClients(): Promise<void> {
    const clients = await this.discordTokenDao.getAllTokenHooks();

    this.activeClients = _.compact(await Promise.all(
      clients.map(client => this.startClient(client.token, client.webhookUrl))));
  }

  public async getUserTokens(userId: string) {
    return this.discordTokenDao.findTokens({
      userId,
    });
  }

  public async addClient(token: string, webhookUrl: string, userId: string): Promise<void> {
    await this.discordTokenDao.addToken(token, webhookUrl, userId);
    const client = await this.startClient(token, webhookUrl);
    if (client) {
      this.activeClients.push(client);
    }
  }

  public async deleteToken(tokenId: string, userId: string): Promise<void> {
    const existingToken = await this.discordTokenDao.getToken(tokenId);
    if (!existingToken) {
      throw new Error(TOKEN_DOES_NOT_EXIST_ERROR);
    }

    if (existingToken.userId !== userId) {
      throw new Error(TOKEN_DOES_NOT_BELONG_TO_USER_ERROR);
    }

    await this.discordTokenDao.deleteToken(tokenId);
  }

  // TODO: Move this into a worker.
  private async startClient(token: string, webhookUrl: string): Promise<DiscordMessageHandler | null> {
    LOG.info(`Starting client for token ${_.truncate(token, { length: 10 })}`);
    if (!webhookUrl) {
      LOG.info(`Not starting client for token ` +
        `${_.truncate(token, { length: 10 })} because there is no matching webhook.`);
      return null;
    }

    const messageHandler = new DiscordMessageHandler(token, webhookUrl);
    await messageHandler.start();

    return messageHandler;
  }
}
