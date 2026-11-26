#!/bin/sh
set -eu
[ "${MERQLOOM_TEST_DISPOSABLE:-}" = yes ] || {
  printf '%s\n' 'MQ106_TEST_REFUSED: Select a disposable Compose project and set MERQLOOM_TEST_DISPOSABLE=yes.' >&2
  exit 1
}
node scripts/verify-disposable.mjs
