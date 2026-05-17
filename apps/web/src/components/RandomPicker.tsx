import { useEffect, useRef, useState } from 'react';
import { type Film, FILM_STATUS_META } from '@cinepass/shared';

interface Props {
  films: Film[];
  open: boolean;
  onClose: () => void;
}

function pickRandom(films: Film[], exclude?: number): Film | null {
  const pool = exclude ? films.filter((f) => f.id !== exclude) : films;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function RandomPicker({ films, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState<Film | null>(null);

  useEffect(() => {
    if (open) {
      setPick(pickRandom(films));
    } else {
      setPick(null);
    }
  }, [open, films]);

  // Echap pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  };

  const reroll = () => {
    setPick((cur) => pickRandom(films, cur?.id));
  };

  return (
    <div
      ref={dialogRef}
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Suggestion aleatoire"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Fermer"
        >
          ✕
        </button>

        <h2 className="mb-1 text-center text-sm font-medium uppercase tracking-wide text-zinc-500">
          🎲 Et si on regardait...
        </h2>

        {!pick && (
          <p className="py-12 text-center text-zinc-500">
            Aucun film disponible avec les filtres actuels.
          </p>
        )}

        {pick && (
          <>
            <div className="mx-auto aspect-[2/3] w-48 overflow-hidden rounded-lg bg-zinc-200 shadow-md">
              {pick.posterUrl ? (
                <img src={pick.posterUrl} alt={pick.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl">🎬</div>
              )}
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold leading-tight">{pick.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {pick.year} · {pick.director}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                {FILM_STATUS_META[pick.status].emoji} {FILM_STATUS_META[pick.status].label}
              </p>
            </div>
          </>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={reroll}
            disabled={!pick}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            🎲 Encore une
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Allez, on regarde !
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-zinc-400">
          Pioche dans les {films.length} films qui matchent tes filtres actuels.
        </p>
      </div>
    </div>
  );
}
