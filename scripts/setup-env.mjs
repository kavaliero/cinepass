#!/usr/bin/env node
/**
 * Cree apps/api/.env depuis .env.example si absent.
 * Portable Windows / Mac / Linux.
 */
import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ENV = resolve(ROOT, 'apps/api/.env');
const EXAMPLE = resolve(ROOT, 'apps/api/.env.example');

if (existsSync(ENV)) {
  console.log('  apps/api/.env existe deja, on garde.');
  process.exit(0);
}

if (!existsSync(EXAMPLE)) {
  console.error('  Erreur : apps/api/.env.example introuvable.');
  process.exit(1);
}

copyFileSync(EXAMPLE, ENV);
console.log('  apps/api/.env cree depuis .env.example.');
