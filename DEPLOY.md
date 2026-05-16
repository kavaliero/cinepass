# Déploiement Cinepass

Guide adapté au serveur **Fortress** de Kavaliero (Ubuntu 20.04, Docker, Caddy déjà actif via `caddy-lexkit`).

## Architecture cible

```
Internet (HTTPS 443)
   │
   ▼
caddy-lexkit (container)              ← deja en place pour lexkit
   │  network_mode: host
   │  Caddyfile: /home/kavaliero/lexkit/Caddyfile
   │  -> reverse_proxy 127.0.0.1:3081
   ▼
cinepass-web (container nginx)        ← nouveau
   │  bind 127.0.0.1:3081  (UFW bloque tout port externe sauf 22/80/443)
   │  auth_basic
   ▼
cinepass-api (container express)      ← nouveau
   │  port interne 3001
   │  volume api-data -> /app/apps/api/prisma
   └─ SQLite cinepass.db (persistant)
```

Le port `3081` suit la convention de tes apps existantes (`3080` lexkit, `3090` lexkit-sandbox).

## Étape 1 : DNS DuckDNS

1. Va sur https://www.duckdns.org/ → login Google/GitHub
2. Crée un sous-domaine `cinepass`
3. IP : `62.210.131.191` (l'IP de Fortress)
4. Update → ça se propage en quelques secondes

Vérifie depuis Fortress :
```bash
dig +short cinepass.duckdns.org
# doit retourner 62.210.131.191
```

## Étape 2 : Clone + secrets

```bash
ssh kavaliero@cinepass.duckdns.org   # ou par IP

cd ~
git clone https://github.com/kavaliero/cinepass.git
cd cinepass

# Copier les exemples
cp .env.example .env
cp docker-compose.override.yml.example docker-compose.override.yml

# Edit .env : mets un vrai mot de passe + le bon port
nano .env
```

Contenu `.env` :
```
CINEPASS_USER=kavaliero
CINEPASS_PASS=<openssl rand -base64 18>   # gen un vrai password long
CINEPASS_PORT=3081
```

Astuce pour générer un password sympa :
```bash
openssl rand -base64 18
# colle le résultat dans CINEPASS_PASS
```

## Étape 3 : Build + démarrage

Le Dockerfile utilise les features BuildKit (`--mount=type=cache`). Sur Compose v1, BuildKit n'est pas activé par défaut. Active-le pour cette session :

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

Pour le rendre permanent, ajoute ces lignes à ton `~/.bashrc`.

Puis :

```bash
cd ~/cinepass
docker-compose up -d --build      # avec tiret pour compose v1
# ou : docker compose up -d --build      # si tu as installé compose v2

# Verifier que ça démarre
docker compose logs -f
# Tu dois voir l'api seed les 471 films + lance le server sur :3001
# Et le web faire htpasswd + nginx -t OK
# Ctrl+C une fois que c'est vert

# Sanity check
curl -sI http://127.0.0.1:3081/healthz
# HTTP/1.1 200 OK

curl -s http://127.0.0.1:3081/api/health
# HTTP/1.1 401 Unauthorized   (normal sans credentials)

curl -s -u kavaliero:<password> http://127.0.0.1:3081/api/health
# {"status":"ok",...}
```

## Étape 4 : Ajouter cinepass au Caddyfile

```bash
nano /home/kavaliero/lexkit/Caddyfile
```

Ajoute en bas :
```
cinepass.duckdns.org {
    reverse_proxy 127.0.0.1:3081
}
```

Le Caddyfile complet ressemblera à :
```
lexkit.duckdns.org {
    reverse_proxy 127.0.0.1:3080
}
kavaliero.duckdns.org {
    reverse_proxy 127.0.0.1:8080 {
        header_up X-Forwarded-Proto https
    }
}
cinepass.duckdns.org {
    reverse_proxy 127.0.0.1:3081
}
```

Reload Caddy (sans redémarrer le container) :
```bash
sudo docker exec caddy-lexkit caddy reload --config /etc/caddy/Caddyfile
```

Tu devrais voir un log type `successfully started server`. Caddy va négocier le cert Let's Encrypt automatiquement (~5-10 sec).

## Étape 5 : Vérifier en HTTPS

Depuis ton PC perso :
```powershell
# Sans credentials -> 401 attendu
curl.exe -I https://cinepass.duckdns.org/
# HTTP/2 401

# Avec -> 200
curl.exe -u "kavaliero:<password>" https://cinepass.duckdns.org/api/health
# {"status":"ok"}
```

Puis browser : https://cinepass.duckdns.org → popup login → tu rentres user/password → liste des films.

## Étape 6 : Smoke tests à distance

Dans le repo local sur ton PC, édite `.env` (à la racine) avec les credentials :
```
CINEPASS_USER=kavaliero
CINEPASS_PASS=<le_meme_password>
```

Puis :
```powershell
SMOKE_URL=https://cinepass.duckdns.org make smoke
# 5 checks doivent passer
```

## Maintenance

### Mise à jour de l'app

```bash
ssh kavaliero@fortress
cd ~/cinepass
git pull
docker compose up -d --build
```

Ça preserve le volume SQLite, donc tes statuts vu/skip restent.

### Changer le mot de passe

```bash
nano .env             # change CINEPASS_PASS
docker compose up -d --build web   # rebuild juste le web
# Le nouveau .htpasswd est genere au boot
```

### Backup SQLite (manuel)

```bash
mkdir -p ~/backups
docker compose cp api:/app/apps/api/prisma/cinepass.db ~/backups/cinepass-$(date +%Y%m%d).db
```

### Backup automatique via cron

```bash
crontab -e
```

Ajoute :
```cron
# Backup Cinepass tous les jours à 3h, garde 30 jours
0 3 * * * cd /home/kavaliero/cinepass && /usr/bin/docker compose cp api:/app/apps/api/prisma/cinepass.db /home/kavaliero/backups/cinepass-$(date +\%Y\%m\%d).db && find /home/kavaliero/backups -name "cinepass-*.db" -mtime +30 -delete
```

### Logs

```bash
# Cinepass api
docker compose -f ~/cinepass/docker-compose.yml logs -f api

# Cinepass web (nginx + acces)
docker compose -f ~/cinepass/docker-compose.yml logs -f web

# Caddy (TLS, requetes entrantes)
sudo docker logs -f caddy-lexkit
```

### Refresh posters TMDB

```bash
cd ~/cinepass
# Mets ta TMDB_API_KEY dans apps/api/.env (cree-le si absent)
echo "TMDB_API_KEY=ta_cle" > apps/api/.env

# Lance le fetch dans le container api
docker compose exec api node scripts/fetch-posters.mjs
```

## Si ça plante

| Symptôme | Diagnostic | Fix |
|----------|-----------|-----|
| `dig +short cinepass.duckdns.org` vide | DNS pas créé/propagé | Re-vérifie sur duckdns.org |
| `curl https://cinepass.duckdns.org` -> certificat invalide | Caddy n'a pas réussi à obtenir le cert | `sudo docker logs caddy-lexkit | tail -50` (rate limit Let's Encrypt ? bloquage port 80 ?) |
| 502 Bad Gateway de Caddy | cinepass-web pas joignable | `docker compose ps` dans `~/cinepass/` - web doit être healthy |
| 401 partout, pas de popup | nginx .htpasswd cassé | `docker compose exec web cat /etc/nginx/.htpasswd` doit montrer une ligne |
| Statuts perdus après reboot | Volume mal monté | `docker volume inspect cinepass_api-data` doit avoir un mountpoint |
| Posters cassés (404) | TMDB temporairement down ou film sans match | `make fetch-posters-retry` |

## Sécurité

- ✅ HTTPS forcé via Caddy + Let's Encrypt auto-renew
- ✅ HTTP Basic Auth (bcrypt) au niveau nginx
- ✅ Port 3081 bind sur loopback uniquement (`127.0.0.1`)
- ✅ UFW bloque tout sauf 22/80/443 → même si quelqu'un scan, le 3081 n'est pas atteignable
- ✅ Pas de secrets en git (`.env` + `docker-compose.override.yml` gitignored)
- ⚠️ Mono-user : tout le monde avec le password peut tout faire. Suffisant pour usage familial.
- ⚠️ Le password est partagé. Si quelqu'un le leak, change-le via `nano .env && docker compose up -d --build web`.
