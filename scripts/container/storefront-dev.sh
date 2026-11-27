#!/bin/sh
set -eu
cd /workspace
node scripts/container/wait-store.cjs
MEDUSA_PUBLISHABLE_KEY=$(cat /run/merqloom/publishable-key)
export MEDUSA_PUBLISHABLE_KEY
printf '%s\n' 'MQ106_STOREFRONT_STARTING: Store API and Redis are ready.'
exec pnpm --dir apps/storefront exec next dev --hostname 0.0.0.0 --port 8000
