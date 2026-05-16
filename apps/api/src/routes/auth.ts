import { Router } from 'express';

export const authRouter: Router = Router();

/**
 * GET /api/auth/me
 *
 * Cette route est protegee par nginx (auth_basic) : si on arrive jusqu'ici,
 * c'est que l'utilisateur a fourni des credentials valides. L'API se contente
 * de renvoyer 200 OK + un payload trivial.
 *
 * Cote frontend, on l'appelle au boot avec `credentials: 'omit'` pour qu'il
 * retourne 401 si pas authentifie (sans afficher le popup browser), permettant
 * de basculer en mode read-only sans friction pour les visiteurs.
 */
authRouter.get('/me', (_req, res) => {
  res.json({ authenticated: true });
});
