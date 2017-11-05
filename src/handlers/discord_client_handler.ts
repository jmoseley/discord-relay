import { NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';
import * as autobind from 'protobind';

import {
  DiscordClientActions,
  TOKEN_DOES_NOT_BELONG_TO_USER_ERROR,
  TOKEN_DOES_NOT_EXIST_ERROR,
} from '../actions';
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
    if (
      !req.body.botToken ||
      !req.body.webhookUri ||
      !req.body.method ||
      (req.body.method !== 'POST' &&
      req.body.method !== 'GET')
    ) {
      // TODO: Generic error handling. We should be able to just throw an error.
      res.status(400).send('"botToken", "webhookUri", and "method" are required.');
      return;
    }
    const headers = _.compact(_.map([1, 2, 3, 4, 5], num => {
      const name = req.body[`headerName${num}`];
      const value = req.body[`headerValue${num}`];

      if (!name || !value) {
        return null;
      }

      return [name, value];
    })) as Array<[string, string]>;
    await this.discordActions.addClient(
      req.body.botToken,
      req.user.userId,
      req.body.webhookUri,
      req.body.method,
      headers,
    );
    res.redirect(302, '/');
  }

  public async removeClient(req: any, res: Response): Promise<void> {
    const tokenId = req.query.tokenId;
    if (!tokenId) {
      res.status(400).send('Must provide token id to delete.');
    }
    if (!req.user) {
      res.status(401).send('Must be logged in.');
      return;
    }

    try {
      await this.discordActions.deleteToken(tokenId, req.user.userId);
    } catch (error) {
      if (
        error.message === TOKEN_DOES_NOT_BELONG_TO_USER_ERROR ||
        error.message === TOKEN_DOES_NOT_EXIST_ERROR) {
          res.status(404).send('Token not found.');
          return;
      }
      throw error;
    }
    res.redirect(302, '/');
  }
}
