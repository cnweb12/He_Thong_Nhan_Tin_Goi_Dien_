#!/bin/sh
set -eu

echo "[dev-entrypoint] Installing dependencies into container volume..."
npm install

exec "$@"
