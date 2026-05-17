import { useState } from 'react';
import type { FilmStatus } from '@cinepass/shared';
import { Header } from './components/Header.js';
import { AuthBanner } from './components/AuthBanner.js';
import { Filters } from './components/Filters.js';
import { FilmList } from './components/FilmList.js';
import { RandomPicker } from './components/RandomPicker.js';
import { useFilms, type FilmFilters } from './hooks/useFilms.js';

export function App() {
  const [filters, setFilters] = useState<FilmFilters>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data, isLoading, isError, error } = useFilms(filters);

  return (
    <div className="min-h-dvh">
      <Header
        activeStatus={filters.status as FilmStatus | undefined}
        onStatusFilter={(status) => {
          setFilters({ ...filters, status });
        }}
        onRandomPick={() => {
          setPickerOpen(true);
        }}
      />
      <AuthBanner />
      <Filters filters={filters} onChange={setFilters} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading && <p className="text-sm text-zinc-500">Chargement...</p>}
        {isError && (
          <p className="text-sm text-red-600">
            Erreur : {error instanceof Error ? error.message : 'inconnue'}
          </p>
        )}
        {data && <FilmList films={data.films} />}
      </main>

      <RandomPicker
        films={data?.films ?? []}
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
