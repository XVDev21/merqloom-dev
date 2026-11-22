#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
umask 077
key=$(docker compose exec -T postgres psql -U merqloom -d merqloom -Atc "select token from api_key where title='Default Publishable API Key' and type='publishable' and revoked_at is null and deleted_at is null")
[[ "$key" =~ ^pk_[[:alnum:]]+$ ]] || { echo 'Expected one active seed publishable key.' >&2; exit 1; }
printf 'MEDUSA_PUBLISHABLE_KEY=%s\nMEDUSA_BACKEND_URL=http://127.0.0.1:19000\n' "$key" > apps/storefront/.env.local
