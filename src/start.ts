import * as express from 'express';

import * as actions from './actions';
import * as handlers from './handlers';
import createLogger from './lib/logger';

const PORT = process.env.PORT || 4001;
const LOG = createLogger('start');

async function start(): Promise<void> {
  const discordClientActions = new actions.DiscordClientActions();

  const statusHandler = new handlers.StatusHandler();
  const discordClientHandler = new handlers.DiscordClientConfigurationHandler(discordClientActions);

  LOG.info('Starting discord-relay');
  const app: express.Application = express();
  // TODO: Make the handlers own the routes.
  app.get('/status', statusHandler.status);
  app.get('/bot/auth', discordClientHandler.addBotToChannel);
  app.get('/bot/add', discordClientHandler.startClient);

  // TODO: Logging middleware.

  app.listen(PORT, () => {
    LOG.info(`Server started on port ${PORT}.`);
  });
}

start().catch((error: any) => {
  LOG.error(error);
});
