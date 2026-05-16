#!/usr/bin/env node
/**
 * Enrichit les films de la BDD avec les posters TMDB.
 *
 * - Idempotent : skip les films qui ont deja un posterUrl
 * - Rate limited : ~3.4 req/s (TMDB autorise ~4/s)
 * - Match par titre + annee, avec plusieurs strategies de fallback
 * - Si match sans poster_path, refait un appel /movie/{id} pour le poster defaut
 * - Overrides manuels pour les films recalcitrants (cf OVERRIDES en bas)
 *
 * Usage :
 *   make fetch-posters
 *   make fetch-posters-retry
 *   make fetch-posters-force
 *
 * Variables d'env :
 *   TMDB_API_KEY      requise
 *   DEBUG_POSTERS=1   logs verbeux (toutes les requetes TMDB)
 */

import { PrismaClient } from '@prisma/client';

const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) {
  console.error('Erreur : TMDB_API_KEY non definie.');
  console.error('  - cree un compte gratuit sur https://www.themoviedb.org/signup');
  console.error('  - Settings -> API -> Request API key (Developer)');
  console.error('  - ajoute TMDB_API_KEY=xxx dans apps/api/.env');
  process.exit(1);
}

const DEBUG = !!process.env.DEBUG_POSTERS;
const FORCE = process.argv.includes('--force');
const RETRY_MISSING = process.argv.includes('--retry-missing');

const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';
const DELAY_MS = 290;

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (color, s) => (useColor ? `${COLORS[color]}${s}${COLORS.reset}` : s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const debug = (...args) => DEBUG && console.log(c('dim', '    [debug]'), ...args);

// ---------- Overrides ----------
// Quand la recherche TMDB ne retourne pas le bon film ou pas de poster, on
// force le tmdbId ici. Format : "<title>_<year>": tmdbId
// L'ID se trouve dans l'URL TMDB : https://www.themoviedb.org/movie/<id>-...
const OVERRIDES = {
  'Wall-E_2008': 10681,
};

// ---------- TMDB ----------

async function tmdbSearch(title, year, lang = 'fr-FR') {
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: lang,
    include_adult: 'false',
    query: title,
  });
  if (year) params.set('year', String(year));
  const url = `${API_BASE}/search/movie?${params.toString()}`;
  debug(`search "${title}" year=${year ?? 'any'} lang=${lang}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB search ${res.status} ${res.statusText}`);
  const data = await res.json();
  debug(`  -> ${data.results?.length ?? 0} results`);
  return data.results ?? [];
}

async function tmdbDetails(tmdbId) {
  debug(`details ${tmdbId}`);
  const res = await fetch(`${API_BASE}/movie/${tmdbId}?api_key=${TMDB_KEY}`);
  if (!res.ok) throw new Error(`TMDB details ${res.status} ${res.statusText}`);
  const data = await res.json();
  debug(`  -> poster_path=${data.poster_path ?? 'null'}`);
  return data;
}

/**
 * Strategies en cascade :
 * 0. Override manuel : si (title, year) est dans OVERRIDES, on fait /movie/{id}
 * 1. Recherche stricte fr-FR (titre + year)
 * 2. Recherche fr-FR sans year, 1er resultat dont l'annee est +-1
 * 3. ASCII fallback (sans accents)
 * 4. Recherche en-US (certains films n'ont pas de match fr-FR)
 */
async function findBestMatch(title, year) {
  const overrideId = OVERRIDES[`${title}_${year}`];
  if (overrideId) {
    debug(`override ${title} ${year} -> tmdbId=${overrideId}`);
    return await tmdbDetails(overrideId);
  }

  let results = await tmdbSearch(title, year);
  if (results.length > 0) return results[0];

  await sleep(DELAY_MS);
  results = await tmdbSearch(title, null);
  const close = results.find((r) => {
    const ry = parseInt(r.release_date?.slice(0, 4) ?? '0', 10);
    return Math.abs(ry - year) <= 1;
  });
  if (close) return close;

  const ascii = title.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (ascii !== title) {
    await sleep(DELAY_MS);
    results = await tmdbSearch(ascii, year);
    if (results.length > 0) return results[0];
  }

  await sleep(DELAY_MS);
  results = await tmdbSearch(title, year, 'en-US');
  if (results.length > 0) return results[0];

  return null;
}

/**
 * Si un match a ete trouve mais sans poster_path, refait un appel /movie/{id}
 * pour recuperer le poster par defaut (independant de la langue de recherche).
 */
async function ensurePoster(match) {
  if (!match || match.poster_path) return match;
  try {
    await sleep(DELAY_MS);
    const details = await tmdbDetails(match.id);
    if (details.poster_path) {
      return { ...match, poster_path: details.poster_path };
    }
    debug(`details.poster_path est null pour ${match.id}`);
  } catch (err) {
    debug(`tmdbDetails(${match.id}) a echoue: ${err.message}`);
  }
  return match;
}

// ---------- Main ----------

const prisma = new PrismaClient();

async function main() {
  const where = FORCE
    ? {}
    : RETRY_MISSING
      ? { posterUrl: null }
      : { posterUrl: null, posterFetchedAt: null };

  const films = await prisma.film.findMany({ where, orderBy: { title: 'asc' } });
  if (films.length === 0) {
    console.log(c('green', 'Tous les films ont deja un poster. Utilise --force pour refresh.'));
    return;
  }

  const estimatedMin = ((films.length * DELAY_MS) / 1000 / 60).toFixed(1);
  console.log(
    c(
      'dim',
      `${films.length} films a traiter (~${estimatedMin} min a ${(1000 / DELAY_MS).toFixed(1)} req/s)\n`,
    ),
  );

  let matched = 0;
  let noMatch = 0;
  let errors = 0;

  for (let i = 0; i < films.length; i++) {
    const film = films[i];
    const progress = `[${String(i + 1).padStart(3)}/${films.length}]`;
    try {
      let match = await findBestMatch(film.title, film.year);
      match = await ensurePoster(match);
      if (!match) {
        await prisma.film.update({
          where: { id: film.id },
          data: { posterFetchedAt: new Date() },
        });
        console.log(`${progress} ${c('yellow', '?')} ${film.title} (${film.year}) - aucun match`);
        noMatch += 1;
      } else {
        const posterUrl = match.poster_path ? `${IMG_BASE}${match.poster_path}` : null;
        await prisma.film.update({
          where: { id: film.id },
          data: {
            tmdbId: match.id,
            posterUrl,
            posterFetchedAt: new Date(),
          },
        });
        if (posterUrl) {
          console.log(`${progress} ${c('green', 'OK')} ${film.title} (${film.year})`);
          matched += 1;
        } else {
          console.log(
            `${progress} ${c('yellow', '?')} ${film.title} (${film.year}) - TMDB sans poster (tmdbId=${match.id})`,
          );
          noMatch += 1;
        }
      }
    } catch (err) {
      console.log(`${progress} ${c('red', 'KO')} ${film.title} (${film.year}) - ${err.message}`);
      errors += 1;
    }
    await sleep(DELAY_MS);

    if ((i + 1) % 20 === 0) {
      console.log(
        c('dim', `  -- progression : ${matched} ok, ${noMatch} no-match, ${errors} erreurs --`),
      );
    }
  }

  console.log('');
  console.log(
    `${c('green', `${matched} posters recuperes`)}, ${c('yellow', `${noMatch} sans match`)}, ${c('red', `${errors} erreurs`)}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
