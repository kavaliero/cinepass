#!/bin/sh
# Entrypoint Docker pour le frontend Cinepass.
# Genere /etc/nginx/.htpasswd depuis les env vars CINEPASS_USER et CINEPASS_PASS
# puis exec nginx. Fail fast si l'un des deux n'est pas defini.

set -eu

: "${CINEPASS_USER:?CINEPASS_USER doit etre defini (ex: dans .env ou docker compose)}"
: "${CINEPASS_PASS:?CINEPASS_PASS doit etre defini (ex: dans .env ou docker compose)}"

if [ ${#CINEPASS_PASS} -lt 8 ]; then
  echo "[entrypoint] WARNING: CINEPASS_PASS fait moins de 8 caracteres, c'est faible." >&2
fi

# -B : bcrypt (le plus secure supporte par nginx auth_basic)
# -b : password en argument (batch mode)
# -n : print to stdout au lieu de modifier un fichier
htpasswd -Bbn "$CINEPASS_USER" "$CINEPASS_PASS" > /etc/nginx/.htpasswd
# 644 : nginx workers (group nginx) doivent pouvoir le lire.
# Le bcrypt protege le password, le fichier peut etre world-readable.
chmod 644 /etc/nginx/.htpasswd

echo "[entrypoint] htpasswd genere pour user '$CINEPASS_USER' ($(wc -c < /etc/nginx/.htpasswd) bytes)"

# Test la config nginx avant de lancer
nginx -t

exec "$@"
