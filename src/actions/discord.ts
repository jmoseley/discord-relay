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
    const tokens = await this.discordTokenDao.getAllTokenHooks();

    const startedClients = _.compact(await Promise.all(_.map(
      tokens,
      (token: IToken) => this.startClient(token),
    )));

    this.activeClients = _.fromPairs(
      _.map(
        startedClients,
        (client: DiscordMessageHandler) => [client.token.tokenId, client],
      ),
    );
  }

  public async getUserTokens(userId: string) {
    return this.discordTokenDao.findTokens({
      userId,
    });
  }

  public async addClient(
    tokenString: string,
    userId: string,
    webhookUri: string,
    method: string,
    headers: Array<[string, string]>,
  ): Promise<void> {
    const token = await this.discordTokenDao.addToken(tokenString, userId, webhookUri, method, headers);
    // If no token, it already exists, which means it is already running.
    if (!token) {
      return;
    }

    const client = await this.startClient(token);
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
    await this.activeClients[tokenId].stop();
    delete this.activeClients[tokenId];
  }

  // TODO: Move this into a worker.
  private async startClient(token: IToken): Promise<DiscordMessageHandler | null> {
    LOG.info(`Starting client for token ${_.truncate(token.token, { length: 10 })}`);

    const messageHandler = new DiscordMessageHandler(token);
    await messageHandler.start();

    return messageHandler;
  }
}
