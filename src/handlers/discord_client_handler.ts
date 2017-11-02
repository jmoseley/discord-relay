import { Request, Response } from 'express';
import * as autobind from 'protobind';

import { DiscordClientActions } from '../actions';
import createLogger from '../lib/logger';

const LOG = createLogger('AuthHandler');

export class DiscordClientConfigurationHandler {
  constructor(private readonly discordActions: DiscordClientActions) {
    autobind(this);
  }

  /**
   * Helper to add a bot to a channel. Just redirects the users browser to the
   * discord endpoint.
   */
  public async addBotToChannel(req: Request, res: Response): Promise<void> {
    if (!req.query.clientId) {
      // TODO: Generic error handling.
      res.status(400).send('"clientId" is required.');
      return;
    }
    res.redirect(
      302,
      `https://discordapp.com/api/oauth2/authorize?client_id=${req.query.clientId}&scope=bot&permissions=1`,
    );
  }

  /**
   * Starts the discord client using the given token.
   */
  public async startClient(req: Request, res: Response): Promise<void> {
    if (!req.query.botToken) {
      // TODO: Generic error handling.
      res.status(400).send('"botToken" is required.');
      return;
    }
    await this.discordActions.startClient(req.query.botToken);
    res.send('success');
  }
}
