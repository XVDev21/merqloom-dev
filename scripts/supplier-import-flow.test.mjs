import { execFileSync } from 'node:child_process'
import { test } from 'node:test'

test('supplier import keeps audit, freshness and native stock safe', {timeout:120000}, () => {
  execFileSync('pnpm', ['--dir','apps/backend','exec','medusa','exec','./src/scripts/mq202-test-fixture.ts'], {
    env:{...process.env, MEDUSA_DISABLE_TELEMETRY:'true'}, stdio:'ignore', timeout:110000,
  })
})
