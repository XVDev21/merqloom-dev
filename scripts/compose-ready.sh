#!/bin/sh
set -eu
for service in postgres redis backend storefront; do
  id=$(docker compose ps -q "$service")
  [ -n "$id" ] || { printf 'MQ106_NOT_RUNNING: %s\n' "$service" >&2; exit 1; }
  state=$(docker inspect --format '{{.State.Health.Status}}' "$id")
  [ "$state" = healthy ] || { printf 'MQ106_NOT_HEALTHY: %s\n' "$service" >&2; exit 1; }
done
docker compose exec -T backend node /workspace/scripts/container/health-backend.cjs
docker compose exec -T storefront node /workspace/scripts/container/health-storefront.cjs
printf '%s\n' 'MQ106_READY: Four services, native Store API and catalog are healthy.'
