import * as AWS from 'aws-sdk';
import * as express from 'express';
import * as request from 'request';

import * as actions from './actions';
import * as daos from './dao';
import * as handlers from './handlers';
import createLogger from './lib/logger';

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
  // TODO: Make the handlers own the routes.
  app.get('/status', statusHandler.status);
  app.get('/bot/auth', discordClientHandler.addBotToChannel);
  app.get('/bot/add', discordClientHandler.addClient);

  // TODO: Logging middleware.

  app.listen(PORT, () => {
    LOG.info(`Server started on port ${PORT}.`);
  });
}

start().catch((error: any) => {
  LOG.error(error);
});
