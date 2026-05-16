import { useAuth } from '../hooks/useAuth.js';

/**
 * Bandeau qui informe l'utilisateur non-auth qu'il est en mode lecture seule.
 * Le bouton "Se connecter" pointe vers /api/auth/me qui force le popup browser
 * de Basic Auth. Une fois validé, un F5 rebascule en mode WRITE.
 */
export function AuthBanner() {
  const { data, isLoading } = useAuth();

  // Pendant le chargement on n'affiche rien (evite un flash de banner)
  if (isLoading) return null;
  // Mode write : pas de banner
  if (data?.authenticated) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <span>
          🔒 <strong>Mode lecture seule.</strong> Tu peux parcourir la watchlist mais pas modifier
          les statuts.
        </span>
        <a
          href="/api/auth/me"
          className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
        >
          Se connecter →
        </a>
      </div>
    </div>
  );
}
