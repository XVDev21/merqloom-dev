import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { parseEnv } from 'node:util'

const require = createRequire(new URL('../apps/storefront/package.json', import.meta.url))
const { Client } = require('pg'), Redis = require('ioredis')
const store = parseEnv(readFileSync('apps/storefront/.env.local', 'utf8'))
const backend = parseEnv(readFileSync('apps/backend/.env', 'utf8'))
const origin = 'http://127.0.0.1:18000'
const contact = {email:'fulfillment@example.test', first_name:'Demo', last_name:'Shopper', address_1:'1 Fictional Street', city:'Makati', postal_code:'1200'}

function fixture(action, suffix) {
  execFileSync('pnpm', ['--dir', 'apps/backend', 'exec', 'medusa', 'exec', './src/scripts/mq104-test-fixture.ts'], {
    env:{...process.env, MEDUSA_DISABLE_TELEMETRY:'true', MQ104_FIXTURE_ACTION:action, MQ104_FIXTURE_SUFFIX:suffix}, stdio:'ignore', timeout:60000,
  })
}

async function createOperator(db, email, password) {
  // The supported CLI creates an invite; the test keeps auth material out of argv and logs.
  try {
    execFileSync('pnpm', ['--dir','apps/backend','exec','medusa','user','--invite','--email',email], {
      env:{...process.env, MEDUSA_DISABLE_TELEMETRY:'true'}, stdio:'ignore', timeout:60000,
    })
    const invite = await db.query('select token from invite where email=$1 and deleted_at is null', [email])
    assert.equal(invite.rows.length, 1)
    const registered = await fetch(`${store.MEDUSA_BACKEND_URL}/auth/user/emailpass/register`, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email,password})})
    assert.equal(registered.status, 200)
    const {token} = await registered.json()
    assert.ok(token)
    const accepted = await fetch(`${store.MEDUSA_BACKEND_URL}/admin/invites/accept?${new URLSearchParams({token:invite.rows[0].token})}`, {
      method:'POST', headers:{authorization:`Bearer ${token}`, 'content-type':'application/json'}, body:JSON.stringify({email,first_name:'Demo',last_name:'Operator'}),
    })
    assert.equal(accepted.status, 200)
  } catch { throw new Error('Disposable native operator setup failed') }
}

async function storeGet(path) {
  const response = await fetch(`${store.MEDUSA_BACKEND_URL}/store/${path}`, {headers:{'x-publishable-api-key':store.MEDUSA_PUBLISHABLE_KEY}})
  assert.equal(response.status, 200, 'native Store request succeeded')
  return response.json()
}
async function postForm(path, fields, cookie) {
  return fetch(origin + path, {method:'POST', redirect:'manual', headers:{origin, 'content-type':'application/x-www-form-urlencoded', ...(cookie && {cookie})}, body:new URLSearchParams(fields)})
}

test('direct inventory is reserved, fulfilled and shipped once through authenticated native Admin', {timeout:120000}, async () => {
  const suffix = randomBytes(6).toString('hex'), sku = `MQ104-FIXTURE-${suffix}`
  const email = `operator-${suffix}@example.test`, password = randomBytes(24).toString('base64url')
  const db = new Client({connectionString:backend.DATABASE_URL}), redis = new Redis(store.MERQLOOM_REDIS_URL)
  let fixtureStarted = false
  try {
    await db.connect()
    fixtureStarted = true
    fixture('create', suffix)
    await createOperator(db, email, password)
    const login = await fetch(`${store.MEDUSA_BACKEND_URL}/auth/user/emailpass`, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email,password})})
    assert.equal(login.status, 200, 'disposable native operator authenticated')
    const {token} = await login.json()
    assert.ok(token)
    const admin = (path, body, authenticated = true) => fetch(`${store.MEDUSA_BACKEND_URL}/admin/${path}`, {
      method:body ? 'POST' : 'GET', headers:{'content-type':'application/json', ...(authenticated && {authorization:`Bearer ${token}`})}, ...(body && {body:JSON.stringify(body)}),
    })
    const {regions} = await storeGet('regions')
    const region = regions.find(r => r.currency_code === 'php' && r.countries.some(c => c.iso_2 === 'ph'))
    assert.ok(region)
    async function fixtureVariant() {
      const {products} = await storeGet(`products?${new URLSearchParams({region_id:region.id, fields:'handle,variants.id,variants.sku,variants.inventory_quantity'})}`)
      const product = products.find(p => p.variants.some(v => v.sku === sku))
      assert.ok(product, 'test fixture is published in the demo channel')
      return {...product.variants.find(v => v.sku === sku), handle:product.handle}
    }
    async function inventory() {
      const {rows} = await db.query("select il.stocked_quantity::int as stocked, il.reserved_quantity::int as reserved, (il.stocked_quantity-il.reserved_quantity)::int as available, il.location_id, il.inventory_item_id from inventory_level il join product_variant_inventory_item vi on vi.inventory_item_id=il.inventory_item_id join product_variant pv on pv.id=vi.variant_id join stock_location sl on sl.id=il.location_id where pv.sku=$1 and sl.name='Demo warehouse' and il.deleted_at is null", [sku])
      assert.equal(rows.length, 1)
      return rows[0]
    }
    async function counts() {
      const {rows} = await db.query('select (select count(*)::int from "order" where deleted_at is null) as orders, (select count(*)::int from fulfillment where deleted_at is null) as fulfillments')
      return rows[0]
    }
    async function state(orderId) {
      const {rows} = await db.query('select f.id, f.location_id, f.provider_id, f.shipped_at, fi.line_item_id, fi.inventory_item_id, fi.quantity::int as quantity, (select count(*)::int from fulfillment_label l where l.fulfillment_id=f.id and l.deleted_at is null) as labels from order_fulfillment o join fulfillment f on f.id=o.fulfillment_id join fulfillment_item fi on fi.fulfillment_id=f.id where o.order_id=$1 and o.deleted_at is null and f.deleted_at is null and fi.deleted_at is null', [orderId])
      return rows
    }
    async function itemProgress(orderId, lineId) {
      const {rows} = await db.query('select quantity::int, fulfilled_quantity::int, shipped_quantity::int from order_item where order_id=$1 and item_id=$2 and deleted_at is null order by version desc limit 1', [orderId,lineId])
      assert.equal(rows.length, 1)
      return rows[0]
    }
    async function reservedFor(lineId) {
      const {rows} = await db.query('select coalesce(sum(quantity),0)::int as quantity from reservation_item where line_item_id=$1 and deleted_at is null', [lineId])
      return rows[0].quantity
    }
    async function labelsFor(fulfillmentId) {
      const {rows} = await db.query('select tracking_number, tracking_url, label_url from fulfillment_label where fulfillment_id=$1 and deleted_at is null order by created_at', [fulfillmentId])
      return rows
    }
    const numeric = ({stocked,reserved,available}) => ({stocked,reserved,available})
    const variant = await fixtureVariant(), initial = await inventory()
    assert.deepEqual(numeric(initial), {stocked:3,reserved:0,available:3})
    assert.equal(variant.inventory_quantity, 3)

    const priorCounts = await counts()
    const unavailable = await postForm('/store/cart/action', {action:'add',handle:variant.handle,variant_id:variant.id,quantity:'4'})
    assert.match(unavailable.headers.get('location'), /error=unavailable/)
    assert.deepEqual(await counts(), priorCounts, 'unavailable stock creates no order or fulfillment')
    assert.deepEqual(numeric(await inventory()), numeric(initial))
    assert.equal((await fixtureVariant()).inventory_quantity, 3)

    const added = await postForm('/store/cart/action', {action:'add',handle:variant.handle,variant_id:variant.id,quantity:'1'})
    assert.match(added.headers.get('location'), /notice=updated/)
    const cookie = added.headers.get('set-cookie')?.split(';')[0]
    assert.ok(cookie)
    const session = JSON.parse(await redis.get(`merqloom:checkout:session:${cookie.split('=')[1]}`))
    const prepared = await postForm('/store/checkout/action', {action:'prepare',...contact}, cookie)
    assert.match(prepared.headers.get('location'), /review/)
    const completed = await postForm('/store/checkout/action', {action:'complete'}, cookie)
    assert.match(completed.headers.get('location'), /confirmation/)
    const confirmation = await (await fetch(origin+'/store/confirmation',{headers:{cookie}})).text()
    const confirmationText = confirmation.replace(/<[^>]+>/g, '')
    assert.ok(confirmationText.includes('Simulated order placed') && confirmationText.includes('Fixture tray') && /Natural\s*×\s*1/.test(confirmationText) && /PHP\s460\.00/.test(confirmationText))
    const links = await db.query('select order_id from order_cart where cart_id=$1 and deleted_at is null', [session.cartId])
    assert.equal(links.rows.length, 1)
    const orderId = links.rows[0].order_id
    assert.deepEqual(numeric(await inventory()), {stocked:3,reserved:1,available:2})
    assert.equal((await fixtureVariant()).inventory_quantity, 2)

    const retrieved = await admin(`orders/${orderId}`)
    assert.equal(retrieved.status, 200)
    const {order} = await retrieved.json(), line = order.items.find(item => item.variant_sku === sku)
    assert.ok(line && line.quantity === 1 && line.variant_id === variant.id, 'Admin shows the same fixture variant and quantity')
    assert.deepEqual([order.item_subtotal,order.shipping_total,order.tax_total,order.total], [450,10,0,460])
    assert.deepEqual(await itemProgress(orderId,line.id), {quantity:1,fulfilled_quantity:0,shipped_quantity:0})
    assert.equal(await reservedFor(line.id), 1)
    const fulfillment = {items:[{id:line.id,quantity:1}],location_id:initial.location_id,no_notification:true}
    const denied = await admin(`orders/${orderId}/fulfillments`, fulfillment, false)
    assert.equal(denied.status, 401)
    assert.equal((await state(orderId)).length, 0)
    assert.deepEqual(numeric(await inventory()), {stocked:3,reserved:1,available:2})

    const created = await admin(`orders/${orderId}/fulfillments`, fulfillment)
    assert.equal(created.status, 200)
    const fulfillments = await state(orderId)
    assert.equal(fulfillments.length, 1)
    assert.ok(fulfillments[0].location_id === initial.location_id && fulfillments[0].inventory_item_id === initial.inventory_item_id && fulfillments[0].line_item_id === line.id)
    assert.equal(fulfillments[0].quantity, 1)
    assert.equal(fulfillments[0].provider_id, 'manual_manual')
    assert.deepEqual(await itemProgress(orderId,line.id), {quantity:1,fulfilled_quantity:1,shipped_quantity:0})
    assert.equal(await reservedFor(line.id), 0)
    assert.deepEqual(numeric(await inventory()), {stocked:2,reserved:0,available:2})
    assert.equal((await fixtureVariant()).inventory_quantity, 2)

    const duplicate = await admin(`orders/${orderId}/fulfillments`, fulfillment)
    assert.ok(duplicate.status === 200 || (duplicate.status >= 400 && duplicate.status < 500), 'replay is rejected or idempotent')
    const afterDuplicate = await state(orderId)
    assert.equal(afterDuplicate.length, 1)
    assert.ok(afterDuplicate[0].id === fulfillments[0].id)
    assert.deepEqual(await itemProgress(orderId,line.id), {quantity:1,fulfilled_quantity:1,shipped_quantity:0})
    assert.deepEqual(numeric(await inventory()), {stocked:2,reserved:0,available:2})

    const shipment = {items:[{id:line.id,quantity:1}],labels:[{tracking_number:'SIMULATED-MQ104',tracking_url:'https://example.test/track',label_url:'https://example.test/label'}],no_notification:true}
    const path = `orders/${orderId}/fulfillments/${fulfillments[0].id}/shipments`
    const deniedShipment = await admin(path, shipment, false)
    assert.equal(deniedShipment.status, 401)
    const afterDeniedShipment = await state(orderId)
    assert.equal(afterDeniedShipment.length, 1)
    assert.equal(afterDeniedShipment[0].shipped_at, null)
    assert.equal(afterDeniedShipment[0].labels, 0)
    assert.deepEqual(await itemProgress(orderId,line.id), {quantity:1,fulfilled_quantity:1,shipped_quantity:0})
    assert.deepEqual(numeric(await inventory()), {stocked:2,reserved:0,available:2})
    const shippedResponse = await admin(path, shipment)
    assert.equal(shippedResponse.status, 200)
    const shipped = await state(orderId)
    assert.equal(shipped.length, 1)
    assert.ok(shipped[0].shipped_at)
    assert.equal(shipped[0].labels, 1)
    const labels = await labelsFor(shipped[0].id)
    assert.deepEqual(labels, shipment.labels)
    assert.deepEqual(await itemProgress(orderId,line.id), {quantity:1,fulfilled_quantity:1,shipped_quantity:1})
    assert.deepEqual(numeric(await inventory()), {stocked:2,reserved:0,available:2})
    assert.equal((await fixtureVariant()).inventory_quantity, 2)
    const repeatedShipment = await admin(path, shipment)
    assert.ok(repeatedShipment.status === 200 || (repeatedShipment.status >= 400 && repeatedShipment.status < 500), 'shipment replay is rejected or idempotent')
    const afterShipmentReplay = await state(orderId)
    assert.equal(afterShipmentReplay.length, 1)
    assert.ok(afterShipmentReplay[0].id === shipped[0].id && String(afterShipmentReplay[0].shipped_at) === String(shipped[0].shipped_at))
    assert.equal(afterShipmentReplay[0].labels, 1)
    assert.deepEqual(await labelsFor(shipped[0].id), labels)
    assert.deepEqual(await itemProgress(orderId,line.id), {quantity:1,fulfilled_quantity:1,shipped_quantity:1})
    assert.deepEqual(numeric(await inventory()), {stocked:2,reserved:0,available:2})
  } finally {
    await db.end()
    await redis.quit()
    if (fixtureStarted) fixture('draft', suffix)
  }
})
