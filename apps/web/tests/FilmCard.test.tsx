import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Film } from '@cinepass/shared';
import { FilmCard } from '../src/components/FilmCard.js';

vi.mock('../src/lib/api.js', () => ({
  api: {
    updateFilm: vi.fn(),
  },
}));

const film: Film = {
  id: 1,
  title: 'Toy Story',
  year: 1995,
  director: 'John Lasseter',
  ageBracket: '3-5',
  status: 'TO_WATCH',
  notes: null,
  watchedAt: null,
  tmdbId: null,
  posterUrl: null,
  posterFetchedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('FilmCard', () => {
  it('affiche le titre, l’année et le réalisateur', () => {
    renderWithQuery(<FilmCard film={film} />);
    // Le titre est dans un h3 (semantic). On le cible specifiquement car
    // sans posterUrl, le fallback affiche aussi le titre en surimpression.
    expect(screen.getByRole('heading', { name: 'Toy Story' })).toBeInTheDocument();
    expect(screen.getByText(/1995.*John Lasseter/)).toBeInTheDocument();
  });
});
