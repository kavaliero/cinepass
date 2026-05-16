#!/usr/bin/env node
/**
 * Supprime node_modules, dist, build artifacts, coverage, etc.
 * Portable Windows / Mac / Linux (pas de rm -rf nececessaire).
 */
import { rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// Patterns simples (chemins relatifs au root)
const SIMPLE_PATHS = ['node_modules', 'coverage', 'playwright-report', 'test-results'];

// Patterns dans chaque sous-dossier de apps/, packages/, e2e
const SUBPROJECT_DIRS = ['apps', 'packages'];
const SUBPROJECT_TARGETS = ['node_modules', 'dist', 'build'];

// Fichiers SQLite locaux
const DB_FILES_DIR = 'apps/api/prisma';
const DB_PATTERNS = [/\.db$/, /\.db-journal$/, /\.sqlite$/];

let removed = 0;

function rm(path) {
  const abs = resolve(ROOT, path);
  if (!existsSync(abs)) return;
  rmSync(abs, { recursive: true, force: true });
  console.log(`  removed ${path}`);
  removed += 1;
}

// 1. Chemins fixes a la racine
for (const p of SIMPLE_PATHS) rm(p);

// 2. Sous-projets : apps/*/node_modules, apps/*/dist, etc.
for (const parent of SUBPROJECT_DIRS) {
  const parentAbs = resolve(ROOT, parent);
  if (!existsSync(parentAbs)) continue;
  for (const child of readdirSync(parentAbs)) {
    const childAbs = join(parentAbs, child);
    if (!statSync(childAbs).isDirectory()) continue;
    for (const target of SUBPROJECT_TARGETS) {
      rm(`${parent}/${child}/${target}`);
    }
  }
}

// 3. e2e specifiquement
for (const target of SUBPROJECT_TARGETS) {
  rm(`e2e/${target}`);
}

// 4. Fichiers DB locaux
const dbDir = resolve(ROOT, DB_FILES_DIR);
if (existsSync(dbDir)) {
  for (const f of readdirSync(dbDir)) {
    if (DB_PATTERNS.some((p) => p.test(f))) {
      rm(`${DB_FILES_DIR}/${f}`);
    }
  }
}

console.log(removed === 0 ? '  (rien a nettoyer)' : `\n  ${removed} chemins supprimes.`);
