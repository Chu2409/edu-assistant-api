#!/bin/sh
set -e

# Ejecutar migraciones de Prisma antes de iniciar la API
if [ "$1" = "node" ] && [ "$2" = "dist/main.js" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
  echo "Migrations completed."
fi

exec "$@"
