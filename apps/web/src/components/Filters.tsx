import { AGE_BRACKETS, AGE_BRACKET_META, FILM_STATUSES, FILM_STATUS_META } from '@cinepass/shared';
import type { FilmFilters } from '../hooks/useFilms.js';

interface Props {
  filters: FilmFilters;
  onChange: (next: FilmFilters) => void;
}

export function Filters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:flex-row md:items-center">
      <input
        type="search"
        placeholder="Rechercher un titre..."
        value={filters.search ?? ''}
        onChange={(e) => {
          onChange({ ...filters, search: e.target.value || undefined });
        }}
        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none md:w-64"
      />

      <div className="flex flex-wrap gap-1">
        <Chip
          label="Tous âges"
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
      </div>

      <div className="flex flex-wrap gap-1">
        <Chip
          label="Tous statuts"
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
    >
      {label}
    </button>
  );
}
