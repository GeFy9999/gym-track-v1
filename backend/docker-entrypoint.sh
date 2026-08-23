#!/bin/sh
set -e

: "${DATABASE_URL:?DATABASE_URL is not set}"

# The SQLite file lives on a mounted volume, so the schema has to be applied at
# container start — not at build time, where it would be baked into an image
# layer that the volume then shadows.
case "$DATABASE_URL" in
  file:*)
    db_path="${DATABASE_URL#file:}"
    mkdir -p "$(dirname "$db_path")"
    ;;
esac

echo "==> Applying migrations to $DATABASE_URL"
npx prisma migrate deploy

echo "==> Seeding reference data (idempotent)"
npx tsx prisma/seed.js

echo "==> Starting server"
exec "$@"
