import * as express from 'express';
import * as autobind from 'protobind';
import * as querystring from 'querystring';

export class PageHandler {
  constructor(
    private readonly clientId?: string,
    private readonly oauthRedirectUri?: string,
  ) {
    autobind(this);
    if (!this.clientId || ! this.oauthRedirectUri) {
      throw new Error('Must set OAuth clientId and OAuth Redirect URI.');
    }
  }

  public async index(req: express.Request, res: express.Response): Promise<void> {
    // Aligns with Authorization Url from https://discordapp.com/developers/docs/topics/oauth2#authorization-code-grant.
    const oauthParams = {
      client_id: this.clientId,
      redirect_uri: this.oauthRedirectUri,
      response_type: 'code',
      scope: 'identify email',
      // state: '123456', // TODO: Change this to something uique to the user.
    };

    res.render('index', {
      oauthParams: querystring.stringify(oauthParams),
     });
  }
}
