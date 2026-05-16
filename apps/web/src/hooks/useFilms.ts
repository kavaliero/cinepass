import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Film, UpdateFilmInput } from '@cinepass/shared';
import { api } from '../lib/api.js';

export interface FilmFilters {
  ageBracket?: string;
  status?: string;
  search?: string;
}

export function useFilms(filters: FilmFilters = {}) {
  return useQuery({
    queryKey: ['films', filters],
    queryFn: () => api.listFilms(filters),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['films', 'stats'],
    queryFn: () => api.stats(),
  });
}

export function useUpdateFilm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateFilmInput }) => api.updateFilm(id, patch),
    onSuccess: (updated: Film) => {
      // Invalide tous les caches qui contiennent des films
      void qc.invalidateQueries({ queryKey: ['films'] });
      // Optimistic patch dans la liste actuelle
      qc.setQueriesData<{ films: Film[]; count: number }>({ queryKey: ['films'] }, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          films: prev.films.map((f) => (f.id === updated.id ? updated : f)),
        };
      });
    },
  });
}
