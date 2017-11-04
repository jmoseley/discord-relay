import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as request from 'request';

import * as actions from './actions';
import * as daos from './dao';
import * as handlers from './handlers';
import createLogger from './lib/logger';
import * as middleware from './lib/middleware';

// I suck at types.
const Router: any = require('express-promise-router');

const PING_URL = 'http://discord-relay.jeremymoseley.net/status';

const PORT = process.env.PORT || 4001;
const LOG = createLogger('start');

async function start(): Promise<void> {
  // Self-Ping the app to keep it awake on Heroku.
  setInterval(() => {
    LOG.info(`Pinging self.`);
    request.get(PING_URL);
  }, 5 * 60 * 1000); // 5 minutes

  const dynamoDB = new AWS.DynamoDB();
  const discordBotsDAO = new daos.DiscordBotsDAO(dynamoDB);
  const discordClientActions = new actions.DiscordClientActions(discordBotsDAO);

  const statusHandler = new handlers.StatusHandler();
  const discordClientHandler = new handlers.DiscordClientConfigurationHandler(discordClientActions);

  LOG.info('Starting discord-relay');
  const app: express.Application = express();
  app.use(middleware.reportErrorsMiddleware);
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '20mb',
  }));
  app.use(bodyParser.json({ limit: '20mb' }));

  const router = Router();
  // TODO: Make the handlers own the routes.
  router.get('/status', statusHandler.status);
  router.get('/bot/auth', discordClientHandler.addBotToChannel);
  router.post('/bot/add', discordClientHandler.addClient);

  app.use(router);

  // TODO: Logging middleware.

  app.listen(PORT, () => {
    LOG.info(`Server started on port ${PORT}.`);
  });
}

start().catch((error: any) => {
  LOG.error(error);
});
