# 🎬 Cinépass

Watchlist familiale de films cultes, **triés par tranche d'âge**. Pour savoir en un coup d'œil quoi regarder en famille selon l'âge des enfants.

> **Statut** : MVP en développement. La V1 expose une UI web qui liste 471 films classés en 7 tranches d'âge (3-5 / 6-8 / 9-12 / 13-15 / 16-17 / 18+) avec un statut "à voir / vu / pas pour nous" persistant.

## Stack

- **Backend** : Express 5 · TypeScript · Prisma · SQLite
- **Frontend** : React 19 · TypeScript · Vite · Tailwind · TanStack Query
- **Tests** : Vitest (unit) · Playwright (E2E)
- **Qualité** : ESLint flat config · Prettier · TypeScript strict
- **CI** : GitHub Actions
- **Monorepo** : pnpm workspaces

## Démarrage rapide

Prérequis : **Node 20.11+** et **pnpm 9+**.

```bash
# 1. Installation
make install

# 2. Setup BDD + seed des 471 films (premiere fois uniquement)
cd apps/api && cp .env.example .env && cd ../..
make db-init

# 3. Lance api + web en parallèle
make dev

# Plus tard, pour reset la BDD :
# make db-reset
```

- API : http://localhost:3001/api/health
- Web : http://localhost:4321 (Vite dev) ou http://localhost:8080 (Docker)

## Démarrage rapide (Docker)

Si tu veux juste voir l'app tourner sans installer Node/pnpm :

```bash
make docker-up        # build + up en arriere-plan
# Ouvre http://localhost:8080
make docker-logs      # tail des logs
make docker-down      # stop (conserve les statuts vu/skip)
```

Le SQLite est persisté dans un volume Docker (`api-data`). Les 471 films sont seedés automatiquement au premier démarrage.

## Commandes utiles

Toutes les commandes courantes sont wrappées dans le `Makefile`. Tape `make` pour voir les 50 cibles disponibles, organisées en 12 sections (Setup, Dev, Build, Tests, E2E, Smoke, Quality, Pipelines, DB, Docker, Clean, Deps).

Les plus utiles au quotidien :

```bash
make             # affiche l'aide colorisée
make setup       # premier setup complet (install + .env + db init)
make dev         # lance api + web en parallèle (hot reload)

# Avant de commit / push
make check       # typecheck + lint + format + tests unit
make pre-push    # check + e2e

# Tests
make test        # unit (api + web)
make e2e         # Playwright
make smoke       # smoke tests contre une instance déployée

# CI complète en local
make ci          # install + check + build + e2e

# Database
make db-reset    # wipe + reseed
make db-backup   # backup le SQLite dans backups/
make db-studio   # Prisma Studio

# Docker
make docker-up    # build + lance la stack (port 8080)
make docker-smoke # up + smoke tests + tear down (test full stack)
make docker-logs  # tail logs api + web
```

Variables utilisables :

- `SMOKE_URL=https://cinepass.example.com make smoke` cible une instance distante
- `CINEPASS_PORT=9000 make docker-up` change le port Docker exposé
- `NO_COLOR=1 make help` désactive les couleurs (CI / logs)

## Structure

```
cinepass/
├── apps/
│   ├── api/              # Backend Express + Prisma + SQLite
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── data/films.json   # Les 471 films sources
│   │   └── src/
│   │       ├── app.ts            # createApp() - utilisable en tests
│   │       ├── index.ts          # Bootstrap HTTP
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── lib/
│   └── web/              # Frontend React + Vite + Tailwind
│       └── src/
│           ├── App.tsx
│           ├── components/
│           ├── hooks/
│           └── lib/
├── packages/
│   └── shared/           # Types partagés (Film, AgeBracket, FilmStatus, ...)
├── e2e/                  # Tests Playwright
├── .github/workflows/    # CI
├── docker-compose.yml    # Stack production-like (api + web nginx)
├── CLAUDE.md             # Instructions pour agents IA
├── DESIGN.md             # Décisions d'architecture
├── CONTRIBUTING.md       # Workflow contributeur
└── Makefile
```

## Données

Les 471 films viennent d'une [liste SensCritique "films cultes à voir"](https://www.senscritique.com/liste/films_cultes_a_voir/4325024) scrapée et classifiée manuellement par tranche d'âge. La source de vérité est `apps/api/prisma/data/films.json`. Le seed est idempotent (upsert sur `title + year`).

## Déploiement

Pour mettre en ligne sur un VPS avec HTTPS automatique + HTTP Basic Auth, suis [DEPLOY.md](DEPLOY.md). En résumé :

1. `cp .env.example .env` + édite les credentials
2. `docker compose up -d --build` sur le VPS
3. Caddy en front pour Let's Encrypt + reverse proxy
4. ~20 minutes du clone à `https://cinepass.kavaliero.fr` qui répond.

## Licence

[GNU Affero General Public License v3.0 ou ultérieure](LICENSE) - voir [DESIGN.md](DESIGN.md) pour le rationnel du choix.
