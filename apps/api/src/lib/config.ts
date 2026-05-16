import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Fallback sur SQLite local pour le mode dev sans .env (ex: docker, CI, premier run).
  // En production, --env-file=.env (ou env de l'orchestrateur) doit fournir la valeur.
  DATABASE_URL: z.string().min(1).default('file:./prisma/cinepass.db'),
  CORS_ORIGIN: z.string().default('http://localhost:4321'),
  // Optionnel : si renseigne, le script fetch-posters peut tourner.
  TMDB_API_KEY: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse(process.env);
