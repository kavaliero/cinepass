import { useStats } from '../hooks/useFilms.js';

export function Header() {
  const { data } = useStats();
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🎬 Cinépass</h1>
          <p className="text-sm text-zinc-600">
            Watchlist familiale, triée par tranche d&apos;âge
          </p>
        </div>
        {data && (
          <div className="flex gap-4 text-sm">
            <Stat label="Total" value={data.total} />
            <Stat label="À voir" value={data.byStatus.TO_WATCH ?? 0} />
            <Stat label="Vus" value={data.byStatus.WATCHED ?? 0} />
            <Stat label="Skip" value={data.byStatus.SKIP ?? 0} />
          </div>
        )}
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}
