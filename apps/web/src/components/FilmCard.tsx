import { type Film, FILM_STATUS_META, nextStatus } from '@cinepass/shared';
import { useUpdateFilm } from '../hooks/useFilms.js';
import { useAuth } from '../hooks/useAuth.js';

interface Props {
  film: Film;
}

// Effet visuel sur la carte selon le statut
const STATUS_CARD: Record<Film['status'], string> = {
  TO_WATCH: '',
  WATCHED: 'ring-4 ring-emerald-500',
  SKIP: 'opacity-30 grayscale',
};

// Style du badge en haut a droite
const STATUS_BADGE: Record<Film['status'], string> = {
  TO_WATCH: 'bg-white/90 text-base',
  WATCHED: 'bg-emerald-500 text-white text-sm shadow-lg',
  SKIP: 'bg-zinc-700/90 text-white text-sm',
};

export function FilmCard({ film }: Props) {
  const update = useUpdateFilm();
  const { data: auth } = useAuth();
  const isAuth = auth?.authenticated ?? false;
  const meta = FILM_STATUS_META[film.status];

  const onClick = () => {
    if (!isAuth) return;
    update.mutate({
      id: film.id,
      patch: { status: nextStatus(film.status) },
    });
  };

  const title = isAuth
    ? `Cliquer pour passer a : ${FILM_STATUS_META[nextStatus(film.status)].label}`
    : 'Mode lecture seule - connecte-toi pour modifier';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAuth || update.isPending}
      className={`group relative flex w-full flex-col gap-1.5 text-left transition ${STATUS_CARD[film.status]} ${!isAuth ? 'cursor-default' : 'cursor-pointer'}`}
      title={title}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-200">
        {film.posterUrl ? (
          <img
            src={film.posterUrl}
            alt={`Affiche ${film.title}`}
            loading="lazy"
            className={`h-full w-full object-cover transition ${isAuth ? 'group-hover:scale-105' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-200 to-zinc-300 p-3 text-center">
            <span className="text-4xl">🎬</span>
            <span className="text-xs font-medium text-zinc-600">{film.title}</span>
          </div>
        )}
        <span
          className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 font-medium backdrop-blur-sm transition ${STATUS_BADGE[film.status]}`}
          aria-label={meta.label}
        >
          {meta.emoji}
        </span>
      </div>
      <div className="min-w-0 px-0.5">
        <h3 className="truncate text-sm font-medium leading-tight">{film.title}</h3>
        <p className="truncate text-xs text-zinc-500">
          {film.year} · {film.director}
        </p>
      </div>
    </button>
  );
}
