#!/usr/bin/env bash
# Pushea a master y despliega a producción en Vercel con un solo comando:
#   ./scripts/ship.sh            → commitea (si hace falta), build, push y deploy
#   ./scripts/ship.sh "mensaje"  → usa ese mensaje de commit sin preguntar
set -euo pipefail
cd "$(dirname "$0")/.."

# 1. Cambios sin commitear → commitearlos (pide mensaje si no vino por argumento)
if [[ -n "$(git status --porcelain)" ]]; then
  echo "── Cambios pendientes ──────────────────────"
  git status --short
  msg="${1:-}"
  if [[ -z "$msg" ]]; then
    read -r -p "Mensaje de commit (vacío = abortar): " msg
    [[ -z "$msg" ]] && { echo "Abortado: nada se pusheó."; exit 1; }
  fi
  git add -A
  git commit -m "$msg"
fi

# 2. Build local: si no compila, no se pushea nada
echo "── Build de verificación ───────────────────"
npm run build

# 3. Push a master
echo "── Push a origin/master ────────────────────"
git push origin master

# 4. Deploy a producción
echo "── Deploy a producción (Vercel) ────────────"
vercel deploy --prod

echo "✅ Listo: master actualizado y producción desplegada."
