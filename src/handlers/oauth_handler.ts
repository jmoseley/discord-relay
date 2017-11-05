import { Request, Response } from 'express';
import * as moment from 'moment';
import * as autobind from 'protobind';
import * as request from 'request-promise-native';

import AuthProvider from '../lib/auth_provider';
import createLogger from '../lib/logger';

const DISCORD_TOKEN_URL = 'https://discordapp.com/api/oauth2/token';
const DISCORD_USER_URL = 'https://discordapp.com/api/users/@me';

const LOG = createLogger('OAuthHandler');

export class OAuthHandler {
  constructor(
    private readonly authProvider: AuthProvider,
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
    const code = req.query.code;

    const authTokens = await request.post(DISCORD_TOKEN_URL, {
      formData: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.oauthRedirectUri,
      },
      json: true,
    });

    // Get user data.
    const userDetails = await request.get(DISCORD_USER_URL, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
      },
      json: true,
    });

    const user = await this.authProvider.addUser({
      accessToken: authTokens.access_token,
      expiresAt: moment().add(authTokens.expires_in, 'seconds').toDate(),
      refreshToken: authTokens.refresh_token,
    }, {
      email: userDetails.email,
      id: userDetails.id,
      username: userDetails.username,
      verified: userDetails.verified,
    });

    res
      .cookie('userId', user.userId, {
        signed: true,
      })
      .redirect(302, '/');
  }
}
