# =============================================================================
# Cinepass - Makefile (portable Windows / Mac / Linux)
# =============================================================================
# Convention :
#   - `## texte` apres un target = description affichee dans `make help`
#   - `##@ NOM`  = section dans `make help`
# Tape `make` (= `make help`) pour la liste complete.
#
# Note Windows : ce Makefile n'utilise PAS de syntaxe shell bash dans les
# recipes. Toute logique conditionnelle vit dans scripts/*.mjs (Node) pour
# fonctionner sur cmd.exe / PowerShell sans Git Bash.
# =============================================================================

.DEFAULT_GOAL := help

PNPM        := pnpm
NODE        := node
DOCKER      := docker compose
SMOKE_URL   ?= http://localhost:8080
CINEPASS_PORT ?= 8080

.PHONY: help info \
        install setup bootstrap \
        dev dev-api dev-web \
        build build-api build-web build-shared build-clean \
        test test-watch test-api test-web test-coverage \
        e2e e2e-ui e2e-headed e2e-install \
        smoke smoke-dev smoke-api \
        lint lint-fix format format-check typecheck audit \
        check pre-push ci \
        db-init db-reset db-seed db-migrate db-studio db-backup db-restore \
        fetch-posters fetch-posters-retry fetch-posters-force \
        docker-build docker-up docker-down docker-nuke \
        docker-logs docker-shell-api docker-shell-web docker-rebuild \
        docker-prune docker-smoke \
        clean clean-deep reset \
        deps-outdated deps-update deps-audit

# =============================================================================
##@ Aide

help: ## Affiche cette aide
	@$(NODE) scripts/make-help.mjs $(MAKEFILE_LIST)

info: ## Affiche versions Node / pnpm / Docker
	@$(NODE) scripts/info.mjs

# =============================================================================
##@ Setup

install: ## Installe toutes les dependencies
	$(PNPM) install

setup: install ## Premier setup (install + .env + db init + git hooks)
	@$(NODE) scripts/setup-env.mjs
	@$(MAKE) db-init
	@$(MAKE) build-shared
	@$(NODE) -e "console.log('  Setup termine.')"
	@$(NODE) -e "console.log('  - Hooks git installes (pre-commit + pre-push) via husky')"
	@$(NODE) -e "console.log('  - Lance : make dev')"

bootstrap: setup ## Alias de setup

# =============================================================================
##@ Dev

dev: ## Lance api + web en parallele (hot reload)
	$(PNPM) -r --parallel run dev

dev-api: ## Lance uniquement API
	$(PNPM) --filter @cinepass/api run dev

dev-web: ## Lance uniquement frontend
	$(PNPM) --filter @cinepass/web run dev

# =============================================================================
##@ Build

build: ## Build api + web + shared (production)
	$(PNPM) -r run build

build-api: ## Build API uniquement
	$(PNPM) --filter @cinepass/api run build

build-web: ## Build frontend uniquement
	$(PNPM) --filter @cinepass/web run build

build-shared: ## Build shared uniquement
	$(PNPM) --filter @cinepass/shared run build

build-clean: clean install build ## Clean + reinstall + build

# =============================================================================
##@ Tests unitaires

test: ## Lance tous les tests unitaires
	$(PNPM) -r run test

test-watch: ## Tests unitaires en watch (api)
	$(PNPM) --filter @cinepass/api run test:watch

test-api: ## Tests unitaires API
	$(PNPM) --filter @cinepass/api run test

test-web: ## Tests unitaires frontend
	$(PNPM) --filter @cinepass/web run test

test-coverage: ## Tests avec couverture (api)
	$(PNPM) --filter @cinepass/api exec vitest run --coverage

# =============================================================================
##@ E2E (Playwright)

e2e: ## Lance les tests E2E Playwright
	$(PNPM) --filter @cinepass/e2e run test

e2e-ui: ## Playwright en mode UI interactive
	$(PNPM) --filter @cinepass/e2e run test:ui

e2e-headed: ## Playwright avec navigateur visible
	$(PNPM) --filter @cinepass/e2e run test:headed

e2e-install: ## Installe les navigateurs Playwright (1ere fois)
	$(PNPM) --filter @cinepass/e2e run install-browsers

# =============================================================================
##@ Smoke (validation post-deploiement)

smoke: ## Smoke tests contre instance deployee (var SMOKE_URL, charge .env pour auth)
	@$(NODE) --env-file-if-exists=.env scripts/smoke.mjs "$(SMOKE_URL)"

smoke-dev: ## Smoke contre le mode dev (web Vite sur :4321 qui proxie /api)
	@$(NODE) scripts/smoke.mjs "http://localhost:4321"

smoke-api: ## Smoke contre l'API directement (sans nginx, port :3001)
	@$(NODE) scripts/smoke.mjs "http://localhost:3001"

# =============================================================================
##@ Qualite du code

lint: ## ESLint sur tout le repo
	$(PNPM) lint

lint-fix: ## ESLint --fix
	$(PNPM) lint:fix

format: ## Prettier --write
	$(PNPM) format

format-check: ## Prettier --check (lecture seule)
	$(PNPM) format:check

typecheck: ## TypeScript --noEmit (tous les workspaces)
	$(PNPM) typecheck

audit: ## Audit de securite des dependencies
	$(PNPM) audit

# =============================================================================
##@ Pipelines (composes)

check: build-shared typecheck lint format-check test ## Pre-commit : build shared + typecheck + lint + format + tests unit

pre-push: check build ## Avant push : check + build (= ce que CI fait sans e2e, ~1 min)

ci: install check build e2e ## Reproduit la pipeline CI complete en local avec e2e (~5 min)

# =============================================================================
##@ Database

db-init: ## Premier setup BDD (migration init + seed)
	$(PNPM) --filter @cinepass/api exec prisma migrate dev --name init
	$(PNPM) --filter @cinepass/api run db:seed

db-reset: ## Reset complet (drop + recreate + reseed)
	$(PNPM) --filter @cinepass/api run db:reset

db-seed: ## Reseed (idempotent, sans wipe)
	$(PNPM) --filter @cinepass/api run db:seed

db-migrate: ## Nouvelle migration : make db-migrate name=add_genres
ifndef name
	$(error Passe un nom : make db-migrate name=add_genres)
endif
	$(PNPM) --filter @cinepass/api exec prisma migrate dev --name $(name)

db-studio: ## Ouvre Prisma Studio (UI BDD)
	$(PNPM) --filter @cinepass/api run db:studio

db-backup: ## Backup le SQLite local dans backups/
	@$(NODE) scripts/db-backup.mjs

db-restore: ## Restore depuis backup : make db-restore from=backups/xxx.db
ifndef from
	$(error Passe un fichier : make db-restore from=backups/xxx.db)
endif
	@$(NODE) scripts/db-restore.mjs "$(from)"

fetch-posters: ## Enrichit la BDD avec les posters TMDB (necessite TMDB_API_KEY)
	$(PNPM) --filter @cinepass/api run fetch-posters

fetch-posters-retry: ## Retente les films sans match TMDB
	$(PNPM) --filter @cinepass/api run fetch-posters -- --retry-missing

fetch-posters-force: ## Re-fetch tous les posters (rafraichit la cache)
	$(PNPM) --filter @cinepass/api run fetch-posters -- --force

# =============================================================================
##@ Docker

docker-build: ## Build les images Docker
	$(DOCKER) build

docker-up: ## Lance la stack Docker (port $(CINEPASS_PORT))
	$(DOCKER) up -d --build
	@$(NODE) scripts/docker-up-info.mjs

docker-down: ## Stoppe la stack (conserve volume SQLite)
	$(DOCKER) down

docker-nuke: ## Stoppe + SUPPRIME le volume SQLite
	$(DOCKER) down -v

docker-logs: ## Tail des logs api + web
	$(DOCKER) logs -f

docker-shell-api: ## Shell dans le container api
	$(DOCKER) exec api sh

docker-shell-web: ## Shell dans le container web
	$(DOCKER) exec web sh

docker-rebuild: docker-down docker-up ## Stop + rebuild + relance

docker-prune: ## Nettoie images / caches Docker inutilises
	docker system prune -f
	docker buildx prune -f

docker-smoke: docker-up ## Up + smoke + tear down (test integration full stack)
	@$(NODE) -e "setTimeout(()=>{},30000)"
	@$(MAKE) smoke SMOKE_URL=http://localhost:$(CINEPASS_PORT)
	@$(MAKE) docker-down

# =============================================================================
##@ Clean

clean: ## Supprime node_modules, dist, build artifacts
	@$(NODE) scripts/clean.mjs

clean-deep: clean ## clean + caches pnpm + caches Docker
	-$(PNPM) store prune
	-docker system prune -f

reset: clean install db-init ## Nuclear option : clean + reinstall + db-init

# =============================================================================
##@ Dependencies

deps-outdated: ## Liste les dependencies obsoletes
	$(PNPM) outdated -r

deps-update: ## Update interactif des dependencies
	$(PNPM) update -i -L -r

deps-audit: ## Alias de audit
	$(PNPM) audit
