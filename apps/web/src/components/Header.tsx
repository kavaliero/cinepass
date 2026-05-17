import { type FilmStatus } from '@cinepass/shared';
import { useStats } from '../hooks/useFilms.js';

interface Props {
  activeStatus?: FilmStatus;
  onStatusFilter: (status: FilmStatus | undefined) => void;
  onRandomPick: () => void;
}

export function Header({ activeStatus, onStatusFilter, onRandomPick }: Props) {
  const { data } = useStats();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🎬 Cinépass</h1>
            <p className="text-sm text-zinc-600">
              Watchlist familiale, triée par tranche d&apos;âge
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onRandomPick}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700"
            title="Qu'est-ce qu'on regarde ce soir ?"
          >
            🎲 Au hasard
          </button>

          {data && (
            <div className="flex gap-1.5">
              <Stat
                label="Total"
                value={data.total}
                active={!activeStatus}
                onClick={() => {
                  onStatusFilter(undefined);
                }}
                accent="zinc"
              />
              <Stat
                label="À voir"
                value={data.byStatus.TO_WATCH ?? 0}
                active={activeStatus === 'TO_WATCH'}
                onClick={() => {
                  onStatusFilter('TO_WATCH');
                }}
                accent="amber"
              />
              <Stat
                label="Vus"
                value={data.byStatus.WATCHED ?? 0}
                active={activeStatus === 'WATCHED'}
                onClick={() => {
                  onStatusFilter('WATCHED');
                }}
                accent="emerald"
              />
              <Stat
                label="Skip"
                value={data.byStatus.SKIP ?? 0}
                active={activeStatus === 'SKIP'}
                onClick={() => {
                  onStatusFilter('SKIP');
                }}
                accent="zinc"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface StatProps {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  accent: 'zinc' | 'amber' | 'emerald';
}

const ACCENT_RING: Record<StatProps['accent'], string> = {
  zinc: 'ring-zinc-900',
  amber: 'ring-amber-500',
  emerald: 'ring-emerald-500',
};

function Stat({ label, value, active, onClick, accent }: StatProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[56px] flex-col items-center rounded-md px-2 py-1 text-center transition hover:bg-zinc-100 ${
        active ? `bg-zinc-50 ring-2 ${ACCENT_RING[accent]}` : ''
      }`}
      aria-pressed={active}
    >
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
    </button>
  );
}
