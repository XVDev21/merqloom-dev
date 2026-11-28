import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { parseEnv } from 'node:util'
import { createOperator } from './native-admin-test-helper.mjs'

const require = createRequire(new URL('../apps/storefront/package.json', import.meta.url))
const {Client} = require('pg')
const backend = parseEnv(readFileSync('apps/backend/.env','utf8'))
const store = parseEnv(readFileSync('apps/storefront/.env.local','utf8'))
const origin = store.MEDUSA_BACKEND_URL

test('supplier import Admin routes require a user and return bounded sanitized audit', {timeout:120000}, async () => {
  const suffix = randomBytes(6).toString('hex'), db = new Client({connectionString:backend.DATABASE_URL})
  await db.connect()
  try {
    const supplier = await db.query("select id from supplier where code='fictional-north' and deleted_at is null")
    assert.equal(supplier.rows.length, 1)
    const supplierId = supplier.rows[0].id
    const body = {supplierId, idempotencyKey:`http-${suffix}`, csv:'external_sku,variant_sku,quantity,observed_at\n'}
    const request = (path, {token, payload, raw} = {}) => fetch(`${origin}/admin/supplier/imports${path}`, {
      method:payload || raw ? 'POST' : 'GET', headers:{'content-type':'application/json', ...(token && {authorization:`Bearer ${token}`})},
      ...((payload || raw) && {body:raw ?? JSON.stringify(payload)}),
    })
    const count = async () => (await db.query('select count(*)::int as n from supplier_import_run')).rows[0].n
    const before = await count()
    assert.ok([401,403].includes((await request('',{payload:body})).status))
    assert.ok([401,403].includes((await request('/sirun_missing')).status))
    const customerEmail = `customer-${suffix}@example.test`, password = randomBytes(24).toString('base64url')
    const customer = await fetch(`${origin}/auth/customer/emailpass/register`, {method:'POST',
      headers:{'content-type':'application/json'}, body:JSON.stringify({email:customerEmail,password})})
    assert.equal(customer.status, 200)
    const customerToken = (await customer.json()).token
    assert.ok(customerToken)
    const created = await fetch(`${origin}/store/customers`, {method:'POST',
      headers:{'content-type':'application/json', authorization:`Bearer ${customerToken}`, 'x-publishable-api-key':store.MEDUSA_PUBLISHABLE_KEY},
      body:JSON.stringify({email:customerEmail, first_name:'Demo', last_name:'Customer'})})
    assert.equal(created.status, 200)
    const login = await fetch(`${origin}/auth/customer/emailpass`, {method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({email:customerEmail,password})})
    assert.equal(login.status, 200)
    const customerBearer = (await login.json()).token
    assert.ok([401,403].includes((await request('',{token:customerBearer,payload:body})).status))
    assert.ok([401,403].includes((await request('/sirun_missing',{token:customerBearer})).status))
    assert.equal(await count(), before, 'rejected principals create no audit or commerce writes')
    const token = await createOperator(db, origin, `operator-${suffix}@example.test`, password)
    const invalidJson = await request('',{token,raw:'MQ202_PRIVATE_MALFORMED_JSON_SENTINEL'})
    assert.equal(invalidJson.status, 400)
    assert.doesNotMatch(await invalidJson.text(), /MQ202_PRIVATE_MALFORMED_JSON_SENTINEL/)
    await db.query(`create or replace function mq202_http_failure() returns trigger language plpgsql as $$
      begin raise exception 'MQ202_PRIVATE_DATABASE_SENTINEL'; end $$`)
    await db.query('create trigger mq202_http_failure before insert on supplier_import_run for each row execute function mq202_http_failure()')
    try {
      const failure = await request('',{token,payload:{...body,idempotencyKey:`failure-${suffix}`}})
      assert.equal(failure.status, 500)
      assert.doesNotMatch(await failure.text(), /MQ202_PRIVATE_DATABASE_SENTINEL|external_sku/)
    } finally {
      await db.query('drop trigger if exists mq202_http_failure on supplier_import_run')
      await db.query('drop function if exists mq202_http_failure()')
    }
    const accepted = await request('',{token,payload:body})
    assert.equal(accepted.status, 200)
    const result = await accepted.json()
    assert.equal(result.run.status, 'succeeded')
    assert.equal(result.run.rowCount, 0)
    assert.doesNotMatch(JSON.stringify(result), /external_sku|idempotencyKey|payload_hash|supplier_id/)
    const fetched = await request(`/${result.run.id}`,{token})
    assert.equal(fetched.status, 200)
    assert.deepEqual(await fetched.json(), result)
    assert.ok([401,403].includes((await request(`/${result.run.id}`,{token:customerBearer})).status))
    assert.equal((await request('',{token,payload:body})).status, 200)
    assert.equal((await request('',{token,payload:{...body,csv:body.csv+'\n'}})).status, 409)
    const sentinel = 'MQ202_PRIVATE_CSV_SENTINEL'
    const rejected = await request('',{token,payload:{...body,idempotencyKey:`bad-${suffix}`,
      csv:`${body.csv}${sentinel},UNAPPROVED,5,2026-01-01T00:00:00Z\n`}})
    assert.equal(rejected.status, 422)
    assert.doesNotMatch(JSON.stringify(await rejected.json()), new RegExp(sentinel))
    const large = await request('',{token,payload:{...body,idempotencyKey:`large-${suffix}`,csv:'a'.repeat(256*1024+1)}})
    assert.equal(large.status, 422)
    assert.equal((await large.json()).run.error.code, 'FILE_TOO_LARGE')
    const oversized = await request('',{token,raw:JSON.stringify({...body,csv:'a'.repeat(512*1024)})})
    assert.equal(oversized.status, 413)
    const storeHeaders = {'x-publishable-api-key':store.MEDUSA_PUBLISHABLE_KEY}
    const supplierStock = await db.query("select il.stocked_quantity from inventory_level il join stock_location sl on sl.id=il.location_id where sl.name='Fictional North supplier stock' and il.deleted_at is null")
    assert.equal(supplierStock.rows.length, 1)
    assert.equal(Number(supplierStock.rows[0].stocked_quantity), 6, 'workflow fixture populated only the isolated supplier location')
    const regions = await (await fetch(`${origin}/store/regions`,{headers:storeHeaders})).json()
    const region = regions.regions.find(item => item.currency_code === 'php')
    assert.ok(region)
    const query = new URLSearchParams({handle:'organizer-pouch',region_id:region.id,fields:'variants.sku,variants.inventory_quantity'})
    const products = await (await fetch(`${origin}/store/products?${query}`,{headers:storeHeaders})).json()
    const pouch = products.products.flatMap(product => product.variants).find(variant => variant.sku === 'MQ-SUPPLIER-POUCH')
    assert.equal(pouch.inventory_quantity, 0, 'supplier location is outside the Store stock path')
    if (process.env.MQ202_BACKEND_LOG) {
      assert.doesNotMatch(readFileSync(process.env.MQ202_BACKEND_LOG,'utf8'), /MQ202_PRIVATE_(CSV|DATABASE|MALFORMED_JSON)_SENTINEL/,
        'CSV values and database errors stay out of backend output')
    }
  } finally { await db.end() }
})
