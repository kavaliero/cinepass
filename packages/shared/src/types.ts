/**
 * Tranches d'âge utilisées par l'app.
 * Source de vérité : alignées sur la note Obsidian "Films cultes a voir".
 */
export const AGE_BRACKETS = ['3-5', '6-8', '9-12', '13-15', '16-17', '18+'] as const;
export type AgeBracket = (typeof AGE_BRACKETS)[number];

/**
 * Statut "vu/à voir/skip" d'un film pour la famille.
 * - TO_WATCH : par défaut, dans la watchlist active
 * - WATCHED  : déjà visionné
 * - SKIP     : pas pour nous (pas envie, contre-indiqué, etc.)
 */
export const FILM_STATUSES = ['TO_WATCH', 'WATCHED', 'SKIP'] as const;
export type FilmStatus = (typeof FILM_STATUSES)[number];

/** Cycle de statut au click (TO_WATCH -> WATCHED -> SKIP -> TO_WATCH) */
export function nextStatus(current: FilmStatus): FilmStatus {
  const i = FILM_STATUSES.indexOf(current);
  return FILM_STATUSES[(i + 1) % FILM_STATUSES.length] as FilmStatus;
}

/** Représentation d'un film côté API (sortie JSON). */
export interface Film {
  id: number;
  title: string;
  year: number;
  director: string;
  ageBracket: AgeBracket;
  status: FilmStatus;
  notes: string | null;
  watchedAt: string | null;
  tmdbId: number | null;
  posterUrl: string | null;
  posterFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FilmsListResponse {
  films: Film[];
  count: number;
}

export interface FilmsStatsResponse {
  total: number;
  byBracket: Partial<Record<AgeBracket, number>>;
  byStatus: Partial<Record<FilmStatus, number>>;
}

export interface UpdateFilmInput {
  status?: FilmStatus;
  notes?: string | null;
}

/** Métadonnées par tranche pour l'affichage. */
export const AGE_BRACKET_META: Record<AgeBracket, { emoji: string; label: string }> = {
  '3-5': { emoji: '🧒', label: '3-5 ans' },
  '6-8': { emoji: '👧', label: '6-8 ans' },
  '9-12': { emoji: '🧑', label: '9-12 ans' },
  '13-15': { emoji: '👦', label: '13-15 ans' },
  '16-17': { emoji: '🧔', label: '16-17 ans' },
  '18+': { emoji: '🔞', label: '18+' },
};

/** Métadonnées par statut pour l'affichage. */
export const FILM_STATUS_META: Record<FilmStatus, { emoji: string; label: string; color: string }> =
  {
    TO_WATCH: { emoji: '⭐', label: 'À voir', color: 'amber' },
    WATCHED: { emoji: '✅', label: 'Vu', color: 'emerald' },
    SKIP: { emoji: '⏭️', label: 'Pas pour nous', color: 'zinc' },
  };
