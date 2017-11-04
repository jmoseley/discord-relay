import { Request, Response } from 'express';
import * as autobind from 'protobind';
import * as request from 'request-promise-native';

import createLogger from '../lib/logger';

const DISCORD_TOKEN_URL = 'https://discordapp.com/api/oauth2/token';

const LOG = createLogger('OAuthHandler');

export class OAuthHandler {
  constructor(
    private readonly clientId?: string,
    private readonly clientSecret?: string,
    private readonly oauthRedirectUri?: string,
  ) {
    autobind(this);
    if (!this.clientId || ! this.oauthRedirectUri || !this.clientSecret) {
      throw new Error('Must set OAuth clientId, clientSecret and OAuth Redirect URI.');
    }
  }

  public async code(req: Request, res: Response): Promise<void> {
    LOG.info(`Fetching oauth token.`);
    const code = req.query.code;

    const result = await request.post(DISCORD_TOKEN_URL, {
      formData: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.oauthRedirectUri,
      },
      json: true,
    });

    LOG.info(`Received response ${JSON.stringify(result, null, 2)}`);

    // TODO: Store the results in a cookie.

    res.send(200);
  }
}
