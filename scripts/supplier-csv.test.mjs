import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

process.env.TS_NODE_PROJECT = new URL('../apps/backend/tsconfig.json', import.meta.url).pathname
const require = createRequire(new URL('../apps/backend/package.json', import.meta.url))
require('ts-node/register/transpile-only')
const parse = (csv, now = new Date('2026-11-28T12:00:00.000Z')) =>
  require('./src/modules/supplier/csv-import.ts').parseSupplierCsv(csv, now)
const header = 'external_sku,variant_sku,quantity,observed_at'
const row = (external = 'POUCH-NATURAL', variant = 'MQ-SUPPLIER-POUCH', quantity = '6', time = '2026-11-28T11:59:00.000Z') =>
  `${external},${variant},${quantity},${time}`

test('strict CSV accepts the exact header, quoted fields, BOM and both line endings', () => {
  const expected = {ok:true, rows:[{row:2, externalSku:'POUCH-NATURAL', variantSku:'MQ-SUPPLIER-POUCH', quantity:6, observedAt:'2026-11-28T11:59:00.000Z'}]}
  assert.deepEqual(parse(`${header}\n${row()}\n`), expected)
  assert.deepEqual(parse(`\uFEFF${header}\r\n" POUCH-NATURAL ","MQ-SUPPLIER-POUCH",6,"2026-11-28T11:59:00.000Z"\r\n`), expected)
  assert.equal(parse(`${header}\n${row('A','B','0','2026-11-28T11:59:00.123456Z')}`).ok, true)
})

test('wrong headers, malformed quoting and duplicate keys reject the entire file', () => {
  assert.equal(parse(`variant_sku,external_sku,quantity,observed_at\n${row()}`).code, 'INVALID_HEADER')
  assert.equal(parse(`external_sku,external_sku,quantity,observed_at\n${row()}`).code, 'INVALID_HEADER')
  assert.equal(parse(`${header}\n"unterminated`).code, 'INVALID_CSV')
  assert.equal(parse(`${header}\r${row()}`).code, 'INVALID_CSV')
  assert.equal(parse(`${header}\n${row('A','X')}\n${row('A','Y')}`).code, 'DUPLICATE_EXTERNAL_SKU')
  assert.equal(parse(`${header}\n${row('A','X')}\n${row('B','X')}`).code, 'DUPLICATE_VARIANT_SKU')
})

test('SKUs, quantities and UTC observations are bounded and validated', () => {
  for (const invalid of ['../unsafe', 'BAD SKU', 'x'.repeat(129), '"A,B"']) {
    const result = parse(`${header}\n${row(invalid)}`)
    assert.equal(result.code, 'INVALID_SKU')
    assert.equal(result.row, 2)
  }
  assert.equal(parse(`${header}\n${row('x'.repeat(128))}`).ok, true)
  for (const invalid of ['-1','1.5','10000','+1','']) assert.equal(parse(`${header}\n${row('A','B',invalid)}`).code, 'INVALID_QUANTITY')
  assert.equal(parse(`${header}\n${row('A','B','9999')}`).ok, true)
  for (const invalid of ['2026-02-30T00:00:00Z','2026-11-28T11:59:00+08:00','not-a-date']) {
    assert.equal(parse(`${header}\n${row('A','B','1',invalid)}`).code, 'INVALID_TIMESTAMP')
  }
  assert.equal(parse(`${header}\n${row('A','B','1','2026-11-28T12:00:00.000001Z')}`).code, 'FUTURE_OBSERVATION')
})

test('file, row and record limits reject one-over inputs without exposing values', () => {
  const rows = count => Array.from({length:count}, (_, index) => row(`E${index}`, `V${index}`)).join('\n')
  assert.equal(parse(`${header}\n${rows(100)}`).rows.length, 100)
  assert.equal(parse(`${header}\n${rows(101)}`).code, 'TOO_MANY_ROWS')
  const base = row('A','B')
  const padded = `${' '.repeat(1024 - base.length)}${base}`
  assert.equal(Buffer.byteLength(padded), 1024)
  assert.equal(parse(`${header}\n${padded}`).ok, true)
  assert.equal(parse(`${header}\n ${padded}`).code, 'RECORD_TOO_LARGE')
  const atLimit = header + '\n' + 'x'.repeat(256 * 1024 - Buffer.byteLength(header) - 1)
  assert.notEqual(parse(atLimit).code, 'FILE_TOO_LARGE')
  assert.equal(parse(atLimit + 'x').code, 'FILE_TOO_LARGE')
  assert.equal(parse(`${header}\n${row('\uD800')}`).code, 'INVALID_UTF8')
  const rejected = parse(`${header}\n${row('RAW_SECRET_VALUE/unsafe')}`)
  assert.equal(rejected.code, 'INVALID_SKU')
  assert.ok(!JSON.stringify(rejected).includes('RAW_SECRET_VALUE'))
})
