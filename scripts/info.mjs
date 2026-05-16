#!/usr/bin/env node
/**
 * Affiche les versions Node / pnpm / Docker installes.
 * Portable Windows / Mac / Linux.
 */
import { execSync } from 'node:child_process';
import { platform, release, arch } from 'node:os';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c('1', s);

const tryCmd = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'non installe';
  }
};

const node = process.version;
const pnpm = tryCmd('pnpm --version');
const docker = tryCmd('docker --version').replace('Docker version ', '');

console.log(bold('Versions'));
console.log(`  Node    : ${node}`);
console.log(`  pnpm    : ${pnpm}`);
console.log(`  Docker  : ${docker}`);
console.log(`  OS      : ${platform()} ${release()} ${arch()}`);
