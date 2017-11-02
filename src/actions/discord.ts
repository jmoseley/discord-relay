import * as Discord from 'discord.js';

import createLogger from '../lib/logger';

const LOG = createLogger('DiscordClientActions');

export class DiscordClientActions {
  public async startClient(token: string): Promise<void> {
    const client = new Discord.Client();

    client.on('ready', () => {
      LOG.info(`Discord Client is ready.`);
    });

    client.on('message', (message: string) => {
      LOG.info(`Got a message: ${message}`);
    });

    await client.login(token);
  }
}
