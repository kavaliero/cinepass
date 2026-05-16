import { createApp } from './app.js';
import { config } from './lib/config.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`[api] Cinépass API listening on http://localhost:${String(config.PORT)}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`\n[api] Received ${signal}, closing server...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
