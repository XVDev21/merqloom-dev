import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

process.env.TS_NODE_PROJECT = new URL('../apps/backend/tsconfig.json', import.meta.url).pathname
const require = createRequire(new URL('../apps/backend/package.json', import.meta.url))
require('ts-node/register/transpile-only')
const decide = input => require('./src/modules/supplier/freshness.ts').decideFreshness(input)
const now = new Date('2026-11-28T12:00:00.000Z')
const base = {mappingLinked:true, latestRefresh:'succeeded', now}
const observed = (observedAt, quantity = 3) => ({observedAt, quantity})

test('freshness expires exactly at fifteen minutes without extending an older observation', () => {
  assert.deepEqual(decide({...base, observation:observed('2026-11-28T11:45:00.001Z')}),
    {eligible:true, reason:'FRESH', observedAt:'2026-11-28T11:45:00.001Z'})
  assert.deepEqual(decide({...base, observation:observed('2026-11-28T11:45:00.000Z')}),
    {eligible:false, reason:'STALE', observedAt:'2026-11-28T11:45:00.000Z'})
  assert.equal(decide({...base, observation:observed('2026-11-28T11:44:59.999Z')}).reason, 'STALE')
})

test('unknown, zero, future, failed refresh and reconciliation fail closed', () => {
  assert.deepEqual(decide({...base}), {eligible:false, reason:'UNKNOWN'})
  assert.equal(decide({...base, observation:observed('2026-11-28T11:59:59Z',0)}).reason, 'OUT_OF_STOCK')
  assert.equal(decide({...base, observation:observed('2026-11-28T12:00:00.000001Z')}).reason, 'FUTURE')
  assert.equal(decide({...base, latestRefresh:'failed', observation:observed('2026-11-28T11:59:59Z')}).reason, 'REFRESH_FAILED')
  assert.equal(decide({...base, latestRefresh:'running', observation:observed('2026-11-28T11:59:59Z')}).reason, 'REFRESH_PENDING')
  assert.equal(decide({...base, latestRefresh:'reconciliation', observation:observed('2026-11-28T11:59:59Z')}).reason, 'RECONCILIATION')
  assert.equal(decide({...base, mappingLinked:false, observation:observed('2026-11-28T11:59:59Z')}).reason, 'MAPPING_UNAVAILABLE')
  assert.equal(decide({...base, thresholdMs:0, observation:observed('2026-11-28T11:59:59Z')}).reason, 'INVALID_CONFIGURATION')
})
