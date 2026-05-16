import { type AgeBracket, AGE_BRACKET_META, type Film } from '@cinepass/shared';
import { FilmCard } from './FilmCard.js';

interface Props {
  bracket: AgeBracket;
  films: Film[];
}

export function AgeSection({ bracket, films }: Props) {
  const meta = AGE_BRACKET_META[bracket];
  if (films.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="sticky top-0 z-10 -mx-4 bg-zinc-50/95 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-700 backdrop-blur">
        {meta.emoji} {meta.label} <span className="text-zinc-400">({films.length})</span>
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {films.map((f) => (
          <li key={f.id}>
            <FilmCard film={f} />
          </li>
        ))}
      </ul>
    </section>
  );
}
