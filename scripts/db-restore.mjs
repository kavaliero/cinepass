#!/usr/bin/env node
/**
 * Restore SQLite depuis un fichier de backup.
 * Usage: node scripts/db-restore.mjs <chemin>
 */
import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/db-restore.mjs <fichier-backup>');
  console.error('Exemple: make db-restore from=backups/cinepass-20260515-203045.db');
  process.exit(1);
}

const ROOT = resolve(import.meta.dirname, '..');
const src = resolve(ROOT, arg);
const dest = resolve(ROOT, 'apps/api/prisma/cinepass.db');

if (!existsSync(src)) {
  console.error(`  Erreur : ${src} introuvable.`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`  Restore OK depuis ${arg}`);
