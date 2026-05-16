import { type Film, FILM_STATUS_META, nextStatus } from '@cinepass/shared';
import { useUpdateFilm } from '../hooks/useFilms.js';

interface Props {
  film: Film;
}

const STATUS_OVERLAY: Record<Film['status'], string> = {
  TO_WATCH: '',
  WATCHED: 'ring-2 ring-emerald-500',
  SKIP: 'opacity-40 grayscale',
};

export function FilmCard({ film }: Props) {
  const update = useUpdateFilm();
  const meta = FILM_STATUS_META[film.status];

  const onClick = () => {
    update.mutate({
      id: film.id,
      patch: { status: nextStatus(film.status) },
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={update.isPending}
      className={`group relative flex w-full flex-col gap-1.5 text-left transition ${STATUS_OVERLAY[film.status]}`}
      title={`Cliquer pour passer a : ${FILM_STATUS_META[nextStatus(film.status)].label}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-200">
        {film.posterUrl ? (
          <img
            src={film.posterUrl}
            alt={`Affiche ${film.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-200 to-zinc-300 p-3 text-center">
            <span className="text-4xl">🎬</span>
            <span className="text-xs font-medium text-zinc-600">{film.title}</span>
          </div>
        )}
        <span
          className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-base shadow-sm backdrop-blur-sm"
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
