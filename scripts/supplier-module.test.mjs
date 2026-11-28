import { execFileSync } from 'node:child_process'
import { test } from 'node:test'

test('supplier identity, concurrent uniqueness, native links and compensation hold', {timeout:120000}, () => {
  execFileSync('pnpm', ['--dir', 'apps/backend', 'exec', 'medusa', 'exec', './src/scripts/mq201-test-fixture.ts'], {
    env:{...process.env, MEDUSA_DISABLE_TELEMETRY:'true'}, stdio:'ignore', timeout:110000,
  })
})
