import { useMemo } from 'react';
import { type AgeBracket, AGE_BRACKETS, type Film } from '@cinepass/shared';
import { AgeSection } from './AgeSection.js';

interface Props {
  films: Film[];
}

export function FilmList({ films }: Props) {
  const grouped = useMemo(() => {
    const out = new Map<AgeBracket, Film[]>();
    for (const b of AGE_BRACKETS) out.set(b, []);
    for (const f of films) {
      out.get(f.ageBracket)?.push(f);
    }
    return out;
  }, [films]);

  if (films.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        Aucun film ne correspond à ces filtres.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {AGE_BRACKETS.map((b) => (
        <AgeSection key={b} bracket={b} films={grouped.get(b) ?? []} />
      ))}
    </div>
  );
}
