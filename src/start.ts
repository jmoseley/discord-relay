import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as request from 'request-promise-native';

import * as actions from './actions';
import * as daos from './dao';
import * as handlers from './handlers';
import AuthProvider from './lib/auth_provider';
import createLogger from './lib/logger';

// I suck at types.
const Router: any = require('express-promise-router');

const PING_URL = 'http://discord-relay.jeremymoseley.net/status';

const PORT = process.env.PORT || 4001;
const LOG = createLogger('start');

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_OAUTH_REDIRECT_URI = process.env.DISCORD_OAUTH_REDIRECT_URI;
const COOKIE_SECRET = process.env.COOKIE_SECRET;

async function start(): Promise<void> {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_OAUTH_REDIRECT_URI) {
    LOG.error('Must set Discord ClientId, ClientSecret, and RedirectURI.');
    process.exit(1);
  }

  // Self-Ping the app to keep it awake on Heroku.
  setInterval(() => {
    LOG.info(`Pinging self.`);
    request.get(PING_URL).catch((err: any) => {
      LOG.error(`Error pinging self: ${err}`);
    });
  }, 5 * 60 * 1000); // 5 minutes

  const dynamoDB = new AWS.DynamoDB({
    region: 'us-west-2',
  });
  const discordBotsDAO = new daos.DiscordBotsDAO(dynamoDB);
  const discordClientActions = new actions.DiscordClientActions(discordBotsDAO);

  const authProvider = new AuthProvider(dynamoDB);

  const statusHandler = new handlers.StatusHandler();
  const discordClientHandler = new handlers.DiscordClientConfigurationHandler(discordClientActions);
  const pageHandler = new handlers.PageHandler(discordClientActions, DISCORD_CLIENT_ID, DISCORD_OAUTH_REDIRECT_URI);
  const oauthHandler = new handlers.OAuthHandler(
    authProvider,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_OAUTH_REDIRECT_URI,
  );

  LOG.info('Starting discord-relay');
  const app: express.Application = express();
  app.set('view engine', 'pug');
  app.use(cookieParser(COOKIE_SECRET));
  app.use(authProvider.middleware());
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '20mb',
  }));
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(express.static('./public'));
  app.set('views', './views');

  // TODO: Pretty error middleware.

  const router = Router();
  // TODO: Make the handlers own the routes.
  router.get('/status', statusHandler.status);
  router.get('/bot/auth', discordClientHandler.addBotToChannel);
  router.post('/bot/add', discordClientHandler.addClient);
  // This should be a POST or DELETE, but a GET can be trigger by a hyperlink.
  router.get('/bot/remove', discordClientHandler.removeClient);
  router.get('/oauth', oauthHandler.code);
  router.get('/', pageHandler.index);
  router.get('/logout', pageHandler.logout);

  app.use(router);

  app.listen(PORT, () => {
    LOG.info(`Server started on port ${PORT}.`);
  });

  await discordClientActions.startPersistedClients();
}

start().catch((error: any) => {
  LOG.error(error);
});
