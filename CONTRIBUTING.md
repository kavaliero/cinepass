# Contribuer à Cinépass

Merci de prendre le temps. Le repo est petit et personnel - les règles ci-dessous sont là pour qu'il le reste : lisible, testé, prévisible.

## Setup local

```bash
# Prérequis : Node 20.11+, pnpm 9+
make install
cp apps/api/.env.example apps/api/.env
make db-reset
make dev
```

## Hooks git automatiques

Le `make setup` installe Husky qui pose deux hooks automatiques :

**Pre-commit** (~10-20s) : lance sur `git commit`

- `lint-staged` : ESLint --fix + Prettier --write **sur les fichiers staged uniquement**
- `tsc --noEmit` : typecheck rapide sur tout le projet

Si le hook detecte des problemes, ESLint/Prettier corrigent en place (tu dois re-stage) ou le commit est bloque.

**Pre-push** (~1 min) : lance sur `git push`

- Reproduit la pipeline CI sans les e2e : `make pre-push` = `make check + make build`
- Si quelque chose foire localement, on evite de polluer GitHub Actions

Pour bypass en urgence (a eviter) :

```bash
git commit --no-verify -m "..."
git push --no-verify
```

Pour reproduire la CI **complete** localement (avec e2e Playwright, ~5 min) :

```bash
make ci
```

## Avant de commit (alternative manuelle si tu veux verifier sans Husky)

```bash
make check   # build shared + typecheck + lint + format + tests unit
```

Si `make check` echoue, corrige avant de commit.

## Conventions de commit

Conventional commits, en français ou anglais (au choix mais cohérent dans une PR) :

```
feat(web): ajoute le random picker
fix(api): corrige le 500 sur PATCH avec body vide
chore(deps): bump prisma 5.20 -> 5.21
docs: explique la stratégie SQLite -> Postgres
test(api): couvre le cas notes=null
refactor(shared): extrait nextStatus dans une fonction pure
ci: cache pnpm store entre les jobs
```

Une PR doit avoir des commits squashables proprement, ou être squashée à la merge.

## Workflow PR

1. Branche depuis `main` : `git checkout -b feat/random-picker`.
2. Code + tests.
3. `make check` passe.
4. Push, ouvre une PR avec :
   - Ce que ça fait (feature ou bug).
   - Pourquoi (lien issue si existe).
   - Comment tester localement (commandes exactes).
   - Captures si UI.
5. Attends que CI passe au vert.
6. Squash & merge.

## Ce qui passe en review

- ✅ La PR est focalisée (pas de "et + j'ai fait le ménage en passant").
- ✅ Les nouveaux types vivent dans `packages/shared` si utilisés des deux côtés.
- ✅ Les nouvelles routes ont au moins un test happy path + un test d'erreur.
- ✅ Les nouveaux composants exposés ont un test rendering + un test d'interaction.
- ✅ Les changements de schema ont une migration Prisma + le seed à jour.
- ✅ Pas de nouveau secret en dur.
- ✅ `.env.example` à jour si nouvelles variables.

## Ce qui NE passe PAS en review

- ❌ Désactivation d'une règle ESLint sans commentaire justifiant.
- ❌ Désactivation d'un test sans commentaire (ou alors `.skip` avec issue ouverte).
- ❌ Ajout d'une dépendance lourde (>50KB gzip) sans justification.
- ❌ Édition manuelle d'une migration Prisma déjà appliquée.
- ❌ Casser le `make check`.

## Style

- Prettier + ESLint sont la source de vérité. Ne discute pas la mise en forme - lance `make format` et passe au sujet.
- TypeScript strict : pas de `any`, pas de `// @ts-ignore` sans justification.
- Composants React : fonctionnels, hooks. Pas de class components.
- Côté API : `async/await`, `try/catch` au niveau route, throw `HttpError` pour les erreurs métier.

## Comment ajouter un film à la liste

La liste vit dans `apps/api/prisma/data/films.json`. Pour en ajouter un :

```jsonc
{
  "title": "Le Roi Lion 2",
  "year": 1998,
  "director": "Darrell Rooney et Rob LaDuca",
  "ageBracket": "3-5",
}
```

Puis `make db-seed`. Le seed est idempotent (upsert sur `title + year`), donc ça n'écrase pas le statut/notes des films existants.

## Questions / blocages

Ouvre une issue avec le tag `question`. Pour les décisions d'architecture, lis [DESIGN.md](DESIGN.md) d'abord.
