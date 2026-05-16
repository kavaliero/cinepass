import express, { type Express } from 'express';
import cors from 'cors';
import { config } from './lib/config.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { filmsRouter } from './routes/films.js';
import { healthRouter } from './routes/health.js';

/**
 * Construit l'app Express. Exportée séparément du listen() pour pouvoir
 * être utilisée dans les tests sans démarrer le serveur HTTP.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/films', filmsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
