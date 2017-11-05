import * as express from 'express';
import * as _ from 'lodash';
import * as autobind from 'protobind';
import * as querystring from 'querystring';

import { DiscordClientActions, IBot } from '../actions';
import createLogger from '../lib/logger';

const LOG = createLogger('PageHandler');

export class PageHandler {
  constructor(
    private readonly discordClientActions: DiscordClientActions,
    private readonly clientId?: string,
    private readonly oauthRedirectUri?: string,
  ) {
    autobind(this);
    if (!this.clientId || ! this.oauthRedirectUri) {
      throw new Error('Must set OAuth clientId and OAuth Redirect URI.');
    }
  }

  // req is an express.Request
  public async index(req: any, res: express.Response): Promise<void> {
    // Aligns with Authorization Url from https://discordapp.com/developers/docs/topics/oauth2#authorization-code-grant.
    const oauthParams = {
      client_id: this.clientId,
      redirect_uri: this.oauthRedirectUri,
      response_type: 'code',
      scope: 'identify email',
      // state: '123456', // TODO: Change this to something uique to the user.
    };

    let bots: IBot[] = [];
    if (req.user) {
      bots = _.map(
        await this.discordClientActions.getUserBots(req.user.userId),
        bot => {
          return {
            ...bot,
            token: _.truncate(bot.token, { length: 10 }),
          };
        },
      );
    }

    res.render('index', {
      bots,
      oauthParams: querystring.stringify(oauthParams),
      user: req.user,
     });
  }

  public async logout(req: express.Request, res: express.Response): Promise<void> {
    res.clearCookie('userId').redirect(302, '/');
  }
}
