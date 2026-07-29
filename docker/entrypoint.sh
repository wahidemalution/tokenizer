#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required" >&2
  exit 1
fi

echo "Running database migrations..."
bun run db:migrate

echo "Starting server on port ${PORT:-3000}..."
exec bun src/index.tsx
