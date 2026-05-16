# CLAUDE.md - Instructions pour agents IA travaillant sur Cinépass

> Ce fichier est lu automatiquement par Claude Code (et autres agents) au démarrage d'une session sur ce repo.
> Il fournit le contexte nécessaire pour ne pas casser l'architecture en place.

## Vue d'ensemble

**Cinépass** = webapp watchlist familiale de films, triés par tranche d'âge.
- 471 films de base (issus d'une liste SensCritique)
- 7 tranches : `0-2` / `3-5` / `6-8` / `9-12` / `13-15` / `16-17` / `18+`
- 3 statuts : `TO_WATCH` (par défaut) / `WATCHED` / `SKIP`
- Mono-utilisateur (pas d'auth) - une "famille" = la BDD entière

## Stack et conventions

- **Monorepo pnpm** : `apps/api` (Express 5), `apps/web` (React 19 + Vite), `packages/shared` (types), `e2e` (Playwright).
- **TypeScript strict** partout (`tsconfig.base.json` = source de vérité, étendu par chaque sous-projet).
- **ESM partout** (`"type": "module"`). Imports relatifs avec extension `.js` (oui même pour `.ts` - c'est NodeNext).
- **Prisma + SQLite** : pas d'enum natif SQLite, donc `ageBracket` et `status` sont des `String` côté schema, validés par zod côté app via les constantes de `@cinepass/shared`.
- **Validation API** : tous les inputs (query, body, params) passent par zod avant d'atteindre Prisma.
- **Erreurs** : throw `new HttpError(status, msg)` dans une route, le middleware formate. Ne jamais renvoyer une réponse manuelle après un throw.
- **State frontend** : TanStack Query pour tout fetch/mutation. Pas de Redux/Zustand pour l'instant.
- **Styling** : Tailwind utility-first. Pas de CSS modules, pas de styled-components.

## Règles strictes

1. **Source de vérité unique pour les types** : `packages/shared/src/types.ts`. Ne jamais redéfinir `AgeBracket` ou `FilmStatus` ailleurs - importer depuis `@cinepass/shared`.
2. **Pas de tirets longs** dans le code, les commits, les UI strings : tirets courts (`-`) uniquement.
3. **Accents en français** : toutes les strings UI françaises doivent garder leurs accents (é, è, à, ç...).
4. **Tests obligatoires** pour toute route API ou hook React non trivial. Le `make check` doit passer avant tout commit.
5. **Migrations Prisma** : toute modif du schema = `pnpm --filter @cinepass/api db:migrate dev --name <nom_explicite>`. Jamais éditer une migration existante.
6. **Pas de secret en dur** : tout passe par `apps/api/.env` (gitignored). Le `.env.example` doit être à jour.
7. **Films seed** : la liste est dans `apps/api/prisma/data/films.json`. Pour ajouter un film, éditer ce JSON et rerun `make db-seed` (idempotent grâce à l'upsert sur `title + year`).
8. **Données utilisateur** : le statut/notes d'un film sont la propriété des utilisateurs. Ne jamais les écraser via le seed.

## Workflow type pour ajouter une feature

1. Si elle touche aux types partagés : modifier `packages/shared/src/types.ts` en premier.
2. Si elle touche au modèle de données : éditer `schema.prisma`, créer une migration, mettre à jour le seed si nécessaire.
3. Backend : nouvelle route dans `apps/api/src/routes/` + test dans `apps/api/tests/`.
4. Frontend : nouveau hook dans `apps/web/src/hooks/` + composant dans `apps/web/src/components/`.
5. E2E : ajouter un scénario dans `e2e/tests/` si la feature est user-facing critique.
6. `make check` doit passer.

## Anti-patterns à éviter

- ❌ Faire un fetch direct dans un composant (passer par un hook + TanStack Query).
- ❌ Mettre de la logique métier dans `apps/web/src/lib/api.ts` (le client API doit rester un transport bête).
- ❌ Toucher à `apps/api/prisma/data/films.json` sans documenter pourquoi (c'est une source de données curatée à la main).
- ❌ Désactiver une règle ESLint avec `// eslint-disable-next-line` sans commentaire expliquant pourquoi.
- ❌ Créer un fichier `.md` à la racine sans qu'il soit indexé dans le README.
- ❌ Ajouter une dépendance "lourde" (Redux, Material UI, axios, lodash...) sans le justifier dans la PR.

## Pour les commits et PRs

- Conventional commits : `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `ci:`.
- Une PR = une feature ou un fix. Pas de PR "et + j'ai fait le ménage en passant".
- Description de PR : qu'est-ce que ça fait, pourquoi, comment tester localement.

## Si bloqué

- Architecture / décisions : voir [DESIGN.md](DESIGN.md).
- Comment contribuer : voir [CONTRIBUTING.md](CONTRIBUTING.md).
- Commandes : `make` ou voir `package.json` scripts.
