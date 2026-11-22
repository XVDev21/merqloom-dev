#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
umask 077
if [[ ! -e .env ]]; then
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)" > .env
fi
# Only read the generated hex value. Never execute an environment file.
password=$(sed -n 's/^POSTGRES_PASSWORD=\([a-f0-9]\{64\}\)$/\1/p' .env)
[[ -n "$password" ]] || { echo 'Expected a generated local database password in .env' >&2; exit 1; }
if [[ ! -e apps/backend/.env ]]; then
  cat > apps/backend/.env <<ENV
DATABASE_URL=postgres://merqloom:$password@127.0.0.1:15432/merqloom
REDIS_URL=redis://127.0.0.1:16379
AUTH_MFA_ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
STORE_CORS=http://127.0.0.1:18000
ADMIN_CORS=http://127.0.0.1:19000
AUTH_CORS=http://127.0.0.1:18000,http://127.0.0.1:19000
ENV
fi
