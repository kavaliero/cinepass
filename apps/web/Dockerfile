# syntax=docker/dockerfile:1.7
# Build context = racine du monorepo (cf. docker-compose.yml).
# Stage 1 : build avec Vite. Stage 2 : nginx servant les statics + proxy /api.

ARG NODE_VERSION=22.11.0
ARG PNPM_VERSION=9.12.0

# ---------- Build ----------
FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY e2e/package.json ./e2e/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter @cinepass/shared build \
 && pnpm --filter @cinepass/web build

# ---------- Runtime ----------
FROM nginx:1.27-alpine AS runtime

# apache2-utils fournit htpasswd (bcrypt) pour generer .htpasswd au boot
RUN apk add --no-cache apache2-utils wget

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
