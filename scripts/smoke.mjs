#!/usr/bin/env node
/**
 * Smoke tests Cinepass.
 *
 * Verifie qu'une instance deployee repond correctement aux requetes critiques.
 * A lancer apres un deploiement / un docker-up / une mise en prod.
 *
 * Usage:
 *   node scripts/smoke.mjs                       # default: http://localhost:8080
 *   node scripts/smoke.mjs http://localhost:3001 # cible directe API (sans nginx)
 *   SMOKE_URL=https://cinepass.example.com node scripts/smoke.mjs
 *
 * Exit codes:
 *   0 = tous les checks passent
 *   1 = au moins un check a echoue
 *   2 = preflight raté (instance unreachable)
 */

const BASE = process.argv[2] ?? process.env.SMOKE_URL ?? 'http://localhost:8080';
const EXPECTED_FILMS = 471;
const TIMEOUT_MS = 10_000;

// HTTP Basic Auth (si l'instance ciblee est protegee via nginx auth_basic)
const AUTH_USER = process.env.CINEPASS_USER;
const AUTH_PASS = process.env.CINEPASS_PASS;
const AUTH_HEADER =
  AUTH_USER && AUTH_PASS
    ? `Basic ${Buffer.from(`${AUTH_USER}:${AUTH_PASS}`).toString('base64')}`
    : null;

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (color, s) => (useColor ? `${COLORS[color]}${s}${COLORS.reset}` : s);
const PASS = c('green', '✓');
const FAIL = c('red', '✗');

let passed = 0;
let failed = 0;

async function fetchJson(path) {
  const url = `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const headers = AUTH_HEADER ? { Authorization: AUTH_HEADER } : {};
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (res.status === 401) {
      throw new Error('401 Unauthorized (defini CINEPASS_USER/CINEPASS_PASS dans .env)');
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return { url, body: await res.json() };
  } catch (err) {
    if (err.cause && err.cause.code === 'ECONNREFUSED') {
      throw new Error(`connexion refusee (l'app n'est pas lancee ?)`);
    }
    if (err.message === 'fetch failed') {
      throw new Error(`fetch failed sur ${url} (DNS / reseau / app down)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function preflight() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const headers = AUTH_HEADER ? { Authorization: AUTH_HEADER } : {};
    await fetch(`${BASE}/api/health`, { signal: ctrl.signal, headers });
    clearTimeout(timer);
    return true;
  } catch {
    console.log(c('red', `\n  ${BASE} ne repond pas.\n`));
    console.log(c('dim', '  Suggestions :'));
    console.log(c('dim', '    - Stack Docker (port 8080) : make docker-up'));
    console.log(c('dim', '    - Mode dev                 : make dev   puis  make smoke-dev'));
    console.log(c('dim', '    - URL custom               : SMOKE_URL=https://... make smoke'));
    console.log('');
    return false;
  }
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ${PASS} ${name}`);
    passed += 1;
  } catch (err) {
    console.log(`  ${FAIL} ${name}`);
    console.log(c('dim', `      ${err.message}`));
    failed += 1;
  }
}

console.log(`${c('bold', 'Cinepass smoke tests')} - ${c('cyan', BASE)}\n`);

if (!(await preflight())) {
  process.exit(2);
}

await check('GET /api/health -> { status: "ok" }', async () => {
  const { body } = await fetchJson('/api/health');
  if (body.status !== 'ok') throw new Error(`status was "${body.status}"`);
});

await check(`GET /api/films -> count == ${EXPECTED_FILMS}`, async () => {
  const { body } = await fetchJson('/api/films');
  if (!Array.isArray(body.films)) throw new Error('films is not an array');
  if (body.count !== EXPECTED_FILMS) {
    throw new Error(`count was ${body.count}, expected ${EXPECTED_FILMS}`);
  }
});

await check('GET /api/films/stats -> { total, byBracket, byStatus }', async () => {
  const { body } = await fetchJson('/api/films/stats');
  if (typeof body.total !== 'number') throw new Error('total missing or wrong type');
  if (!body.byBracket || typeof body.byBracket !== 'object') throw new Error('byBracket missing');
  if (!body.byStatus || typeof body.byStatus !== 'object') throw new Error('byStatus missing');
  if (body.total !== EXPECTED_FILMS) {
    throw new Error(`total was ${body.total}, expected ${EXPECTED_FILMS}`);
  }
});

await check('GET /api/films?ageBracket=6-8 -> tous les films sont en 6-8', async () => {
  const { body } = await fetchJson('/api/films?ageBracket=6-8');
  if (body.count === 0) throw new Error('no films returned');
  const wrong = body.films.find((f) => f.ageBracket !== '6-8');
  if (wrong) throw new Error(`film "${wrong.title}" has ageBracket=${wrong.ageBracket}`);
});

await check('GET /api/films?search=Toy%20Story -> au moins 1 resultat', async () => {
  const { body } = await fetchJson('/api/films?search=Toy%20Story');
  if (body.count === 0) throw new Error('no films matched "Toy Story"');
});

console.log('');
console.log(
  `${c('bold', 'Resultat')}: ${c('green', `${passed} passed`)}, ${failed > 0 ? c('red', `${failed} failed`) : '0 failed'}`,
);

if (failed > 0) {
  process.exit(1);
}
