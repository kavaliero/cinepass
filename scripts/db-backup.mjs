#!/usr/bin/env node
/**
 * Backup le SQLite local vers backups/cinepass-YYYYMMDD-HHMMSS.db
 * Portable Windows / Mac / Linux.
 */
import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = resolve(ROOT, 'apps/api/prisma/cinepass.db');
const DIR = resolve(ROOT, 'backups');

if (!existsSync(SRC)) {
  console.error(`  Erreur : ${SRC} introuvable. Lance "make db-init" d'abord.`);
  process.exit(1);
}

mkdirSync(DIR, { recursive: true });

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const dest = resolve(DIR, `cinepass-${ts}.db`);

copyFileSync(SRC, dest);
const size = (statSync(dest).size / 1024).toFixed(1);
console.log(`  Backup OK : backups/cinepass-${ts}.db (${size} KB)`);
