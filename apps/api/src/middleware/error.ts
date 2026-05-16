import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

/**
 * Erreur HTTP typée. Throw `new HttpError(404, 'Film not found')` dans une route
 * et le middleware ci-dessous formate la réponse JSON proprement.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not Found' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
};
