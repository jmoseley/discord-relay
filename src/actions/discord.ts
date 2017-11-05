import * as _ from 'lodash';

import { DiscordBotsDAO, IToken } from '../dao';
import DiscordMessageHandler from '../lib/discord';
import createLogger from '../lib/logger';

const LOG = createLogger('DiscordClientActions');

export { IToken } from '../dao';

export const TOKEN_DOES_NOT_EXIST_ERROR = 'TOKEN_DOES_NOT_EXIST';
export const TOKEN_DOES_NOT_BELONG_TO_USER_ERROR = 'TOKEN_DOES_NOT_BELONG_TO_USER';

export class DiscordClientActions {
  private activeClients: {
    [key: string]: DiscordMessageHandler;
  };

  constructor(private readonly discordTokenDao: DiscordBotsDAO) {
    this.activeClients = {};
  }

  // TODO: Move this into a worker.
  public async startPersistedClients(): Promise<void> {
    const clients = await this.discordTokenDao.getAllTokenHooks();

    const activeClients = _.compact(await Promise.all(_.map(
      clients,
      (client: IToken) => this.startClient(client.token, client.webhookUrl, client.tokenId),
    )));

    this.activeClients = _(activeClients)
      .map((client: DiscordMessageHandler) => [client.tokenId, client])
      .fromPairs()
      .value();
  }

  public async getUserTokens(userId: string) {
    return this.discordTokenDao.findTokens({
      userId,
    });
  }

  public async addClient(tokenString: string, webhookUrl: string, userId: string): Promise<void> {
    const token = await this.discordTokenDao.addToken(tokenString, webhookUrl, userId);
    // If no token, it already exists, which means it is already running.
    if (!token) {
      return;
    }

    const client = await this.startClient(tokenString, webhookUrl, token.tokenId);
    if (client) {
      this.activeClients[token.tokenId] = client;
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
  private async startClient(token: string, webhookUrl: string, tokenId: string): Promise<DiscordMessageHandler | null> {
    LOG.info(`Starting client for token ${_.truncate(token, { length: 10 })}`);
    if (!webhookUrl) {
      LOG.info(`Not starting client for token ` +
        `${_.truncate(token, { length: 10 })} because there is no matching webhook.`);
      return null;
    }

    const messageHandler = new DiscordMessageHandler(token, webhookUrl, tokenId);
    await messageHandler.start();

    return messageHandler;
  }
}
