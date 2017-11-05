import { NextFunction, Request, Response } from 'express';
import * as autobind from 'protobind';

import { DiscordClientActions } from '../actions';
import createLogger from '../lib/logger';

const LOG = createLogger('BotClientConfigurationHandler');

export class DiscordClientConfigurationHandler {
  constructor(private readonly discordActions: DiscordClientActions) {
    autobind(this);
  }

  /**
   * Helper to add a bot to a channel. Just redirects the users browser to the
   * discord oauth endpoint.
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
  public async addClient(req: any, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).send('Must login before adding bots.');
      return;
    }
    if (!req.body.botToken || !req.body.webhookUrl) {
      // TODO: Generic error handling. We should be able to just throw an error.
      res.status(400).send('"botToken" and "webhookUrl" are required.');
      return;
    }
    await this.discordActions.addClient(req.body.botToken, req.body.webhookUrl, req.user.userId);
    res.redirect(302, '/');
  }
}
