# DESIGN.md - Architecture et décisions

## Vision

Cinépass est une **watchlist familiale visuelle** qui répond à une question simple :
"Qu'est-ce qu'on peut regarder ce soir avec les enfants, en fonction de leur âge ?"

L'objectif n'est PAS de refaire IMDB ou SensCritique. L'app prend une liste curatée (à la main, par tranche d'âge) et la rend agréable à parcourir et à mettre à jour.

## Choix structurants

### Pourquoi un monorepo pnpm

- **Types partagés** entre backend et frontend (zéro drift entre `Film` côté API et `Film` côté UI).
- **CI unifiée** : un seul `pnpm install`, un seul lockfile, un seul lint/typecheck pass.
- **Refacto safe** : changer un nom de champ casse le typecheck partout immédiatement.

Alternative considérée : Turborepo. Rejeté pour ne pas ajouter de complexité tant qu'on n'a pas besoin de cache distribué.

### Pourquoi Express 5 (et pas Hono / Fastify / Next.js API)

- **Cohérence** avec l'écosystème dev de Nicolas (Castellan utilise déjà Express 5).
- **Maturité** : middlewares, écosystème, doc.
- Express 5 (vs 4) pour le support async/await natif des handlers.

Alternatives considérées :

- **Hono** : plus rapide et moderne, mais Nicolas connaît mieux Express. À reconsidérer si on déploie sur edge (Cloudflare Workers).
- **Next.js API routes** : aurait fusionné backend et frontend, mais on perd la séparation propre + SSR pas utile ici.

### Pourquoi SQLite + Prisma

- **Mono-utilisateur** = pas besoin de Postgres. SQLite tient sur disque, zéro setup.
- **Prisma** pour le typage strict des queries et les migrations versionnées.
- **Migration vers Postgres possible** : Prisma abstrait suffisamment.

Trade-off : SQLite ne supporte pas les enums Prisma. On stocke `ageBracket` et `status` en `String`, validés par zod. C'est un peu moins safe au niveau BDD mais largement suffisant avec une validation app stricte.

### Pourquoi React 19 + Vite + TanStack Query (pas de framework méta)

- **Vite** : DX excellent, build rapide, zéro magie.
- **React 19** : Server Components pas utiles ici (pas de SSR), donc on reste sur du client pur.
- **TanStack Query** : la seule librairie qui gère bien le cache + l'état serveur sans réécrire 50% du store soi-même.
- **Pas de Next** : on ne fait pas de SSR/SSG, l'API est séparée. Ajouter Next ajouterait des concepts pour rien.

### Pourquoi Tailwind (vs CSS modules / styled-components / shadcn)

- **Vitesse de prototypage** maximale pour un projet solo.
- **Pas de CSS orphelin** : si un composant disparaît, ses classes disparaissent avec lui.
- **shadcn/ui** envisagé pour V2 quand on aura besoin de composants riches (modales, dropdowns accessibles).

## Modèle de données

```
Film
├── id           Int      (auto)
├── title        String
├── year         Int
├── director     String
├── ageBracket   String   ("0-2" | "3-5" | ... | "18+")
├── status       String   ("TO_WATCH" | "WATCHED" | "SKIP")  default TO_WATCH
├── notes        String?  (pour annoter "trop intense" / "à revoir avec papa")
├── watchedAt    DateTime?  (auto-set quand status -> WATCHED)
├── createdAt    DateTime
└── updatedAt    DateTime

Index : ageBracket, status
Unique : (title, year)
```

Pourquoi pas séparer `Film` (catalogue) et `WatchEntry` (statut utilisateur) :
On démarre **mono-utilisateur**. Le statut vit avec le film. Si on passe multi-user un jour, on extrait dans une table séparée + migration. Pas de pré-optimisation.

## API

REST minimaliste, pas de GraphQL :

| Méthode | Endpoint           | Utilité                                                          |
| ------- | ------------------ | ---------------------------------------------------------------- |
| GET     | `/api/health`      | Healthcheck (utilisé en CI/CD et monitoring)                     |
| GET     | `/api/films`       | Liste filtrable (`?ageBracket=6-8&status=TO_WATCH&search=harry`) |
| GET     | `/api/films/stats` | Compte par tranche et par statut (pour le header)                |
| PATCH   | `/api/films/:id`   | Update status et/ou notes                                        |

Pas encore implémenté (V2) :

- `POST /api/films` : ajouter un film à la main.
- `DELETE /api/films/:id` : retirer un film.
- `POST /api/import` : importer une liste SensCritique externe.

## Flux frontend

1. `App.tsx` détient les filtres locaux (search, ageBracket, status).
2. `useFilms(filters)` (TanStack Query) fetch `/api/films?...`.
3. `FilmList` regroupe par `ageBracket` côté client.
4. Click sur une `FilmCard` → `useUpdateFilm()` → PATCH → cache invalidé + optimistic update.

Pas de routing pour l'instant (single page). Si on ajoute une page "Stats" ou "Histoire", on prendra `react-router` ou `@tanstack/react-router`.

## Tests

- **Vitest unit** : routes API critiques (CRUD + edge cases) + composants React clés.
- **Playwright E2E** : 1 happy path complet (load → search → click → status changed). On reste léger pour ne pas plomber la CI.
- **Fixtures** : pour les unit API, on reset la BDD via `prisma migrate reset --skip-seed` puis on insère les fixtures inline. Pour les composants React, on mock `api.ts` via `vi.mock`.

## CI/CD

### CI (implémentée)

GitHub Actions, déclenchée sur PR + push main :

1. Job `quality` : install → prisma generate → typecheck → lint → format check → tests unit → build.
2. Job `e2e` : dépend de `quality`. Build, démarre api + web en background, lance Playwright.

### CD (partiel)

**Stack Docker** prête à déployer (`docker compose up -d --build`) :

- Image API multi-stage : Node 20 alpine, prod deps uniquement, entrypoint qui sync le schema (`prisma migrate deploy` si migrations, sinon `prisma db push`) puis seed (idempotent).
- Image web multi-stage : build Vite, runtime nginx alpine qui sert les statics et proxie `/api` vers le service api.
- Volume Docker `api-data` pour persister le SQLite. Backup = `docker compose cp api:/app/apps/api/prisma/cinepass.db ./`.
- Healthchecks sur les deux services. Le web `depends_on` l'api en `service_healthy`.
- Port exposé : `${CINEPASS_PORT:-8080}` (web uniquement, l'API est en réseau interne).

**Hébergement cible** (à choisir au moment du déploiement) :

- **Auto-hébergé sur VPS OVH** (Nicolas en a un) : `docker compose up -d` et reverse proxy Caddy/Traefik devant pour HTTPS. Cohérent avec son infra existante.
- **Fly.io** : un app par service ou les deux dans une seule machine, volume persistant Fly. Bon trade-off coût/simplicité.
- **Vercel + Railway** : web sur Vercel (gratuit), api + SQLite sur Railway. Migration vers Postgres recommandée pour Railway.

**Persistance SQLite en prod** : OK tant qu'on est sur un volume monté (VPS, Fly, Railway). Anti-pattern sur Vercel/Lambda (filesystem éphémère) - dans ce cas migrer vers Postgres.

**CD GitHub Actions** : pas encore wiré. Quand on choisira l'hôte, on ajoutera un workflow `deploy.yml` qui build + push l'image sur ghcr.io + ssh + `docker compose pull && up -d` (auto-hébergé) ou un déclencheur Fly/Railway.

## Auth

**Choix V1 : Lecture publique, écriture protégée par HTTP Basic Auth** (cf [DEPLOY.md](DEPLOY.md)).

Architecture :

- `GET /api/*` : public (n'importe qui peut lire la liste, les stats, etc.)
- `PATCH/POST/PUT/DELETE /api/*` : Basic Auth via nginx `limit_except GET`
- `GET /api/auth/me` : protégé, sert au frontend à savoir s'il est authentifié
- Le frontend HTML/JS/CSS : public

Côté UX :

- Visiteur non-auth : voit un bandeau "🔒 Mode lecture seule" + bouton "Se connecter"
- Click sur "Se connecter" → `/api/auth/me` → browser affiche popup Basic Auth → user entre credentials → F5 → mode WRITE
- En mode read-only, les `FilmCard` sont disabled (pas de hover scale, cursor default, tooltip "connecte-toi pour modifier")

Cas d'usage :

- Nicolas : Basic Auth, peut tout modifier
- Famille/amis avec le lien : voient la liste, peuvent commenter "ah tiens vous avez pas encore vu X"

Rationnel :

- L'app est mono-utilisateur ("la famille"). Pas besoin de comptes individuels, juste de protéger contre les scans/bots aléatoires.
- Basic Auth est implémenté en ~10 lignes de config nginx, géré à l'infrastructure (pas de code app à maintenir).
- bcrypt côté serveur (`htpasswd -B`), credentials passés en env vars (`CINEPASS_USER`/`CINEPASS_PASS`), jamais en dur.
- Browser remember = pas chiant au quotidien.
- `/healthz` reste public (sinon les healthchecks Docker tombent).

Alternatives considérées :

- **App-level PIN + cookie** : plus joli UX mais 100+ lignes de code à maintenir, vulnérable à plus de bugs.
- **OAuth (Google)** : overkill pour 2-3 utilisateurs familiaux.
- **Tailscale / VPN only** : oblige tout le monde à installer Tailscale, trop friction.
- **Read-only public + write protégé** : envisageable V2 si on veut partager la liste avec des amis.

Migration future :

- Multi-utilisateur (V2) : ajouter une table `User`, JWT cookies, voir DESIGN.md roadmap.
- Le jour où on migre : retirer `auth_basic` de nginx, faire la migration app-side.

## Licence

**AGPL v3** - choisie pour les raisons suivantes :

- Open source mais protège contre le clonage commercial pur (clause SaaS qui force la publication des modifs).
- Compatible avec une éventuelle version commerciale hébergée par Nicolas (lui-même est libre de monétiser sa version puisqu'il en est l'auteur).
- En accord avec l'écosystème de tools qu'on admire : Mastodon, Cal.com, Plausible, Bitwarden, Nextcloud.

Le jour où une intégration commerciale serait demandée, on pourra envisager une **double-licence AGPL + commerciale**.

## Roadmap (post-MVP)

V1.1 :

- Random picker ("qu'est-ce qu'on regarde ce soir ?" avec filtres âge).
- Notes par film en UI.
- Persistance des filtres en localStorage.

V1.2 :

- Posters TMDB (cache local des images).
- Genres + filtres par genre.
- Dark mode.

V2 :

- Multi-profils (sans auth, juste switch "Lou" / "Papa" / "Maman").
- Import de listes externes (SensCritique, IMDB CSV).
- PWA installable sur mobile.
