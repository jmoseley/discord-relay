import * as express from 'express';

import StatusHandler from './handlers/status_handler';
import createLogger from './lib/logger';

const PORT = process.env.PORT || 4001;
const LOG = createLogger('start');

async function start(): Promise<void> {
  const statusHandler = new StatusHandler();

  LOG.info('Starting discord-relay');
  const app: express.Application = express();
  app.get('/status', statusHandler.status);

  // TODO: Logging middleware.

  app.listen(PORT, () => {
    LOG.info(`Server started on port ${PORT}`);
  });
}

start().catch((error: any) => {
  LOG.error(error);
});
