# syntax=docker/dockerfile:1.7
# Build context = racine du monorepo (cf. docker-compose.yml).
# Multi-stage : on installe les dev deps + on build, puis on copie juste le runtime.

ARG NODE_VERSION=22.11.0
ARG PNPM_VERSION=9.12.0

# ---------- Base ----------
FROM node:${NODE_VERSION}-alpine AS base
# Re-declare ARGs inside the stage (Docker quirk : ARGs avant FROM ne sont
# accessibles que dans la ligne FROM elle-meme).
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---------- Deps (cache friendly) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY e2e/package.json ./e2e/
RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @cinepass/shared build \
 && pnpm --filter @cinepass/api exec prisma generate \
 && pnpm --filter @cinepass/api build

# ---------- Runtime ----------
FROM node:${NODE_VERSION}-alpine AS runtime
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate \
 && apk add --no-cache wget
WORKDIR /app

# Manifests + lockfile pour install des prod deps uniquement
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod

# Schema Prisma (necessaire AVANT prisma generate)
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm --filter @cinepass/api exec prisma generate

# Code build + entrypoint
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY apps/api/scripts ./apps/api/scripts
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Persistance SQLite via volume
VOLUME ["/app/apps/api/prisma"]

WORKDIR /app/apps/api
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
