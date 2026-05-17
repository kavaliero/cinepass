import { AGE_BRACKETS, AGE_BRACKET_META, FILM_STATUSES, FILM_STATUS_META } from '@cinepass/shared';
import type { FilmFilters } from '../hooks/useFilms.js';

interface Props {
  filters: FilmFilters;
  onChange: (next: FilmFilters) => void;
}

export function Filters({ filters, onChange }: Props) {
  const hasActiveFilters = Boolean(filters.search || filters.ageBracket || filters.status);

  return (
    <div className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
        <input
          type="search"
          placeholder="Rechercher un titre..."
          value={filters.search ?? ''}
          onChange={(e) => {
            onChange({ ...filters, search: e.target.value || undefined });
          }}
          className="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />

        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Âge
          </span>
          <Chip
            label="Tous"
            active={!filters.ageBracket}
            onClick={() => {
              onChange({ ...filters, ageBracket: undefined });
            }}
          />
          {AGE_BRACKETS.map((b) => (
            <Chip
              key={b}
              label={`${AGE_BRACKET_META[b].emoji} ${b}`}
              active={filters.ageBracket === b}
              onClick={() => {
                onChange({ ...filters, ageBracket: b });
              }}
            />
          ))}

          <span className="ml-3 mr-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Statut
          </span>
          <Chip
            label="Tous"
            active={!filters.status}
            onClick={() => {
              onChange({ ...filters, status: undefined });
            }}
          />
          {FILM_STATUSES.map((s) => (
            <Chip
              key={s}
              label={`${FILM_STATUS_META[s].emoji} ${FILM_STATUS_META[s].label}`}
              active={filters.status === s}
              onClick={() => {
                onChange({ ...filters, status: s });
              }}
            />
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onChange({});
              }}
              className="ml-2 rounded-full border border-transparent px-3 py-1 text-xs text-zinc-500 underline hover:text-zinc-900"
            >
              Effacer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? 'border-zinc-900 bg-zinc-900 text-white'
          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
