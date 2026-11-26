#!/bin/sh
set -eu
cd /workspace
node scripts/container/wait-dependencies.cjs
printf '%s\n' 'MQ106_INITIALIZING: Checking local migrations and demo seed.'
if ! pnpm --dir apps/backend exec medusa db:migrate >/dev/null 2>&1; then
  printf '%s\n' 'MQ106_MIGRATION_FAILED: Local initialization failed; check the disposable database and configuration.' >&2
  exit 1
fi
node scripts/container/publishable-key.cjs
printf '%s\n' 'MQ106_BACKEND_STARTING: Local data is ready.'
exec pnpm --dir apps/backend exec medusa develop --host 0.0.0.0 --port 9000
