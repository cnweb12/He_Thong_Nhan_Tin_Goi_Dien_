#!/bin/sh
set -eu

if [ ! -x node_modules/.bin/tsx ]; then
  echo "[dev-entrypoint] Installing dependencies into container volume..."
  npm install
fi

exec "$@"
