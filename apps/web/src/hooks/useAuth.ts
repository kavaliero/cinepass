import { useQuery } from '@tanstack/react-query';

interface AuthState {
  authenticated: boolean;
}

/**
 * Verifie si l'utilisateur est authentifie via nginx Basic Auth.
 *
 * - Si oui (200) : mode WRITE, les modifs sont possibles.
 * - Si non (401) : mode READ-ONLY, les clics sur les films sont desactives
 *   et un bandeau invite a se connecter via /api/auth/me (qui lui force
 *   le popup browser).
 */
export function useAuth() {
  return useQuery<AuthState>({
    queryKey: ['auth'],
    queryFn: async () => {
      // credentials: 'include' permet au browser d'envoyer les credentials Basic
      // s'il les a deja en cache pour ce domaine.
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      return { authenticated: res.ok };
    },
    staleTime: 60_000,
    retry: false,
  });
}
