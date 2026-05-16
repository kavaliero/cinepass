#!/bin/sh
# Parse les commentaires `## ...` et `##@ SECTION` des Makefiles passes en
# argument et affiche une aide colorisee. Sort dans un fichier separe pour
# eviter les problemes de quoting awk vs apostrophes francaises dans le
# Makefile principal.
#
# Usage: ./scripts/make-help.sh Makefile [Makefile.local ...]

awk '
BEGIN {
  FS = ":.*?## "
  bold = "\033[1m"
  dim  = "\033[2m"
  cyan = "\033[36m"
  reset = "\033[0m"
}
/^##@/ {
  printf "\n%s%s%s\n", bold, substr($0, 5), reset
  next
}
/^[a-zA-Z_][a-zA-Z0-9_-]*:.*?## / {
  printf "  %s%-18s%s %s\n", cyan, $1, reset, $2
}
' "$@"
