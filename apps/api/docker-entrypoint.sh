#!/bin/sh
# Entrypoint Docker pour l'API Cinepass.
# - Sync le schema Prisma (migrations si presentes, sinon db push)
# - Seed les 471 films (idempotent : upsert sur title+year)
# - Lance la commande passee en CMD (par defaut : node dist/index.js)

set -eu

cd /app/apps/api

if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "[entrypoint] Applying migrations (prisma migrate deploy)"
  pnpm exec prisma migrate deploy
else
  echo "[entrypoint] No migrations found, syncing schema (prisma db push)"
  pnpm exec prisma db push --skip-generate
fi

echo "[entrypoint] Seeding films (idempotent)"
pnpm exec tsx prisma/seed.ts

echo "[entrypoint] Starting API: $*"
exec "$@"
