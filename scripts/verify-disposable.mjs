import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

// This guard verifies the selected project and endpoints; the operator must
// still designate its volumes as disposable before running order-creating tests.
try {
  const compose = (...args) => execFileSync('docker', ['compose', ...args], { encoding:'utf8', stdio:['ignore','pipe','pipe'] }).trim()
  const config = JSON.parse(compose('config','--format','json'))
  assert.ok(config.name && config.name !== 'merqloom-dev', 'Select a separate disposable project')
  const backend = parseEnv(readFileSync('apps/backend/.env','utf8'))
  const store = parseEnv(readFileSync('apps/storefront/.env.local','utf8'))
  const db = new URL(backend.DATABASE_URL), redis = new URL(backend.REDIS_URL)
  assert.equal(`${db.hostname}:${db.port}`, compose('port','postgres','5432'))
  assert.equal(`${redis.hostname}:${redis.port}`, compose('port','redis','6379'))
  assert.equal(db.pathname, '/merqloom')
  assert.ok(new URL(store.MERQLOOM_REDIS_URL).href === redis.href)
  assert.equal(new URL(store.MEDUSA_BACKEND_URL).origin, 'http://127.0.0.1:19000')
  assert.equal(compose('port','backend','9000'), '127.0.0.1:19000')
  assert.equal(compose('port','storefront','8000'), '127.0.0.1:18000')
  const key = compose('exec','-T','postgres','psql','-U','merqloom','-d','merqloom','-Atc',"select token from api_key where title='Default Publishable API Key' and type='publishable' and revoked_at is null and deleted_at is null")
  assert.ok(store.MEDUSA_PUBLISHABLE_KEY === key)
  for (const service of ['postgres','redis','backend','storefront']) {
    const id = compose('ps','-q',service)
    assert.ok(id)
    const owner = execFileSync('docker',['inspect','--format','{{ index .Config.Labels "com.docker.compose.project" }}',id],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
    assert.equal(owner, config.name)
  }
  console.log('MQ106_DISPOSABLE_CONFIRMED: Project, app endpoints and data services match.')
} catch {
  console.error('MQ106_TEST_REFUSED: The selected disposable project and test endpoints could not be verified.')
  process.exitCode = 1
}
