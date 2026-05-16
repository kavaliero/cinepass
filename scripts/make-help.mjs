#!/usr/bin/env node
/**
 * Parse les commentaires ## et sections ##@ dans les Makefiles passes en args
 * et affiche une aide colorisee. Portable Windows / Mac / Linux (pas de sh requis).
 *
 * Usage : node scripts/make-help.mjs Makefile [Makefile.local ...]
 */
import { readFileSync } from 'node:fs';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c('1', s);
const cyan = (s) => c('36', s);
const dim = (s) => c('2', s);

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/make-help.mjs Makefile [...]');
  process.exit(1);
}

const sectionRe = /^##@\s*(.+?)\s*$/;
const targetRe = /^([a-zA-Z_][a-zA-Z0-9_-]*):.*?##\s+(.+?)\s*$/;

console.log(`${bold('Cinepass')} - ${dim('cibles Makefile')}`);

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf-8');
  } catch (err) {
    console.error(`  (impossible de lire ${file}: ${err.message})`);
    continue;
  }

  for (const line of content.split('\n')) {
    const sm = sectionRe.exec(line);
    if (sm) {
      console.log(`\n${bold(sm[1])}`);
      continue;
    }
    const tm = targetRe.exec(line);
    if (tm) {
      console.log(`  ${cyan(tm[1].padEnd(18))} ${tm[2]}`);
    }
  }
}

const SMOKE_URL = process.env.SMOKE_URL ?? 'http://localhost:8080';
const PORT = process.env.CINEPASS_PORT ?? '8080';
console.log(`\n${dim(`Variables : SMOKE_URL=${SMOKE_URL}, CINEPASS_PORT=${PORT}`)}`);
