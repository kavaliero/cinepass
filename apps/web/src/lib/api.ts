import type {
  Film,
  FilmsListResponse,
  FilmsStatsResponse,
  UpdateFilmInput,
} from '@cinepass/shared';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${String(res.status)}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listFilms: (params?: { ageBracket?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.ageBracket) qs.set('ageBracket', params.ageBracket);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    const q = qs.toString();
    return request<FilmsListResponse>(`/films${q ? `?${q}` : ''}`);
  },
  stats: () => request<FilmsStatsResponse>('/films/stats'),
  updateFilm: (id: number, patch: UpdateFilmInput) =>
    request<Film>(`/films/${String(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};
