#!/bin/sh
set -e

echo "Waiting for PostgreSQL at postgres:5432..."
attempt=0
max_attempts=30

until nc -z postgres 5432 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "ERROR: Cannot reach postgres:5432 after ${max_attempts}s"
    echo "DNS lookup for postgres:"
    getent hosts postgres || echo "  (failed)"
    exit 1
  fi
  sleep 1
done

echo "PostgreSQL is reachable"

npm run prisma:generate
npm run migration:run
exec npm run start:dev
