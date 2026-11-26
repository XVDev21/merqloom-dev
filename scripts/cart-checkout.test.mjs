import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const { MEDUSA_PUBLISHABLE_KEY: key, MEDUSA_BACKEND_URL: backend } = parseEnv(readFileSync('apps/storefront/.env.local', 'utf8'))
const origin = 'http://127.0.0.1:18000'
const storeHeaders = { 'x-publishable-api-key': key }

async function native(path) {
  const response = await fetch(`${backend}/store/${path}`, { headers: storeHeaders })
  assert.equal(response.status, 200)
  return response.json()
}
async function variants() {
  const { regions } = await native('regions')
  const region = regions.find(r => r.currency_code === 'php' && r.countries.some(c => c.iso_2 === 'ph'))
  assert.ok(region)
  const { products } = await native(`products?${new URLSearchParams({region_id:region.id, fields:'handle,variants.id,variants.sku,variants.inventory_quantity'})}`)
  return Object.fromEntries(products.flatMap(p => p.variants.map(v => [v.sku, {...v, handle:p.handle}])))
}
async function post(path, fields, cookie) {
  return fetch(origin + path, { method:'POST', redirect:'manual', headers:{ origin, 'content-type':'application/x-www-form-urlencoded', ...(cookie && {cookie}) }, body:new URLSearchParams(fields) })
}

test('adding the selected native variant creates a persistent session cart', async () => {
  const all = await variants()
  const natural = all['MQ-DIRECT-TRAY']
  const response = await post('/store/cart/action', {action:'add',handle:natural.handle,variant_id:natural.id,quantity:'1'})
  assert.equal(response.status, 303)
  const cookie = response.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie, 'cart session cookie is set')
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i)
  const cart = await fetch(origin + '/store/cart', {headers:{cookie}})
  assert.equal(cart.status, 200)
  assert.match(await cart.text(), /Desk tray/)
})

test('checkout rejects missing fields and completes one simulated order', async () => {
  const all = await variants()
  const natural = all['MQ-DIRECT-TRAY']
  const added = await post('/store/cart/action', {action:'add',handle:natural.handle,variant_id:natural.id,quantity:'1'})
  const cookie = added.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie)
  const invalid = await post('/store/checkout/action', {action:'prepare',email:'wrong'}, cookie)
  assert.equal(invalid.status, 303)
  assert.match(invalid.headers.get('location'), /invalid=/)
  const invalidPage = await fetch(invalid.headers.get('location'), {headers:{cookie}})
  const html = await invalidPage.text()
  assert.match(html, /Enter a valid email/)
  assert.match(html, /Enter a first name/)
  const prepared = await post('/store/checkout/action', {action:'prepare',email:'shopper@example.test',first_name:'Demo',last_name:'Shopper',address_1:'1 Sample Street',city:'Makati',postal_code:'1200'}, cookie)
  assert.equal(prepared.status, 303)
  assert.match(prepared.headers.get('location'), /review/)
  const review = await (await fetch(prepared.headers.get('location'), {headers:{cookie}})).text()
  assert.match(review, /Simulated shipping/)
  assert.match(review, /PHP\s460\.00/)
  const completed = await post('/store/checkout/action', {action:'complete'}, cookie)
  assert.equal(completed.status, 303)
  assert.match(completed.headers.get('location'), /confirmation/)
  const confirmation = await (await fetch(completed.headers.get('location'), {headers:{cookie}})).text()
  assert.match(confirmation, /Simulated order placed/)
  assert.match(confirmation, /PHP\s460\.00/)
})

test('reset cannot erase a cart while another operation holds its session lock', async () => {
  const { createRequire } = await import('node:module')
  const require = createRequire(new URL('../apps/storefront/package.json', import.meta.url))
  const Redis = require('ioredis')
  const { MERQLOOM_REDIS_URL } = parseEnv(readFileSync('apps/storefront/.env.local', 'utf8'))
  const redis = new Redis(MERQLOOM_REDIS_URL)
  const all = await variants()
  const natural = all['MQ-DIRECT-TRAY']
  const added = await post('/store/cart/action', {action:'add',handle:natural.handle,variant_id:natural.id,quantity:'1'})
  const cookie = added.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie)
  const token = cookie.split('=')[1]
  const sessionKey = `merqloom:checkout:session:${token}`
  try {
    assert.equal(await redis.set(`${sessionKey}:lock`, 'test-owner', 'EX', 15, 'NX'), 'OK')
    const reset = await post('/store/cart/action', {action:'reset'}, cookie)
    assert.equal(reset.status, 303)
    assert.match(reset.headers.get('location'), /busy/)
    const completion = await post('/store/checkout/action', {action:'complete'}, cookie)
    assert.equal(completion.status, 303)
    assert.match(completion.headers.get('location'), /busy/)
    assert.ok(await redis.get(sessionKey), 'session and cart remain available')
  } finally {
    await redis.del(`${sessionKey}:lock`, sessionKey)
    await redis.quit()
  }
})

const { createRequire } = await import('node:module')
const { execFileSync } = await import('node:child_process')
const requireFromStore = createRequire(new URL('../apps/storefront/package.json', import.meta.url))
const Redis = requireFromStore('ioredis')
const { Client } = requireFromStore('pg')
const localEnv = parseEnv(readFileSync('apps/storefront/.env.local', 'utf8'))
const backendEnv = parseEnv(readFileSync('apps/backend/.env', 'utf8'))
const contact = {email:'shopper@example.test',first_name:'Demo',last_name:'Shopper',address_1:'1 Sample Street',city:'Makati',postal_code:'1200'}
function redisClient() { return new Redis(localEnv.MERQLOOM_REDIS_URL) }
function cookieFrom(response) { return response.headers.get('set-cookie')?.split(';')[0] }
async function sessionFor(redis, cookie) { return JSON.parse(await redis.get(`merqloom:checkout:session:${cookie.split('=')[1]}`)) }
async function addCart(variant, quantity = 1) {
  const response = await post('/store/cart/action', {action:'add',handle:variant.handle,variant_id:variant.id,quantity:String(quantity)})
  assert.equal(response.status, 303)
  assert.match(response.headers.get('location'), /notice=updated/)
  const cookie = cookieFrom(response)
  assert.ok(cookie)
  return cookie
}
async function nativeCart(id) { return (await native(`carts/${id}?fields=%2Bitems.total`)).cart }
function fixture(action) {
  execFileSync('pnpm', ['--dir','apps/backend','exec','medusa','exec','./src/scripts/mq103-test-fixture.ts'], {
    env:{...process.env, MQ103_FIXTURE_ACTION:action, MEDUSA_DISABLE_TELEMETRY:'true'}, stdio:'ignore', timeout:60000,
  })
}
async function orderCount(cartId) {
  const db = new Client({connectionString:backendEnv.DATABASE_URL})
  await db.connect()
  try { return (await db.query('select order_id from order_cart where cart_id=$1', [cartId])).rows.map(row => row.order_id) }
  finally { await db.end() }
}

test('separate sessions, invalid variants, quantities, and supplier stock are enforced', async () => {
  const all = await variants()
  const natural = all['MQ-DIRECT-TRAY'], walnut = all['MQ-DIRECT-TRAY-WALNUT'], pouch = all['MQ-SUPPLIER-POUCH']
  const redis = redisClient()
  try {
    const first = await addCart(natural)
    const second = await addCart(walnut)
    const firstSession = await sessionFor(redis, first), secondSession = await sessionFor(redis, second)
    assert.notEqual(firstSession.cartId, secondSession.cartId)
    assert.deepEqual((await nativeCart(firstSession.cartId)).items.map(i => i.variant_id), [natural.id])
    assert.deepEqual((await nativeCart(secondSession.cartId)).items.map(i => i.variant_id), [walnut.id])
    const line = (await nativeCart(firstSession.cartId)).items[0]
    for (const fields of [
      {action:'add',handle:natural.handle,variant_id:'variant_missing',quantity:'1'},
      {action:'add',handle:pouch.handle,variant_id:pouch.id,quantity:'1'},
      {action:'add',handle:natural.handle,variant_id:natural.id,quantity:String(natural.inventory_quantity + 1)},
      {action:'update',line_id:line.id,quantity:'0'},
      {action:'update',line_id:line.id,quantity:'1.5'},
      {action:'update',line_id:line.id,quantity:'9999'},
    ]) {
      const response = await post('/store/cart/action', fields, first)
      assert.match(response.headers.get('location'), /error=/)
    }
    assert.equal((await nativeCart(firstSession.cartId)).items[0].quantity, 1)
    const foreign = await fetch(origin + '/store/cart/action', {method:'POST',redirect:'manual',headers:{origin:'https://elsewhere.example','content-type':'application/x-www-form-urlencoded',cookie:first},body:'action=reset'})
    assert.equal(foreign.status, 403)
  } finally { await redis.quit() }
})

test('two distinct direct-stock products coexist, update, remove, and match native totals', async () => {
  fixture('enable')
  const redis = redisClient()
  try {
    const all = await variants()
    const natural = all['MQ-DIRECT-TRAY'], coaster = all['MQ103-FIXTURE-COASTER']
    assert.ok(coaster, 'test fixture is published in the demo channel')
    const cookie = await addCart(natural)
    const added = await post('/store/cart/action', {action:'add',handle:coaster.handle,variant_id:coaster.id,quantity:'2'}, cookie)
    assert.match(added.headers.get('location'), /notice=updated/)
    const {cartId} = await sessionFor(redis, cookie)
    let cart = await nativeCart(cartId)
    assert.equal(cart.items.length, 2)
    assert.equal(cart.item_subtotal, 700)
    let html = await (await fetch(origin + '/store/cart', {headers:{cookie}})).text()
    assert.match(html, /PHP\s700\.00/)
    const coasterLine = cart.items.find(item => item.variant_id === coaster.id)
    assert.ok(coasterLine)
    const updated = await post('/store/cart/action', {action:'update',line_id:coasterLine.id,quantity:'3'}, cookie)
    assert.match(updated.headers.get('location'), /notice=updated/)
    cart = await nativeCart(cartId)
    assert.equal(cart.item_subtotal, 825)
    html = await (await fetch(origin + '/store/cart', {headers:{cookie}})).text()
    assert.match(html, /PHP\s825\.00/)
    const removed = await post('/store/cart/action', {action:'remove',line_id:coasterLine.id}, cookie)
    assert.match(removed.headers.get('location'), /notice=updated/)
    cart = await nativeCart(cartId)
    assert.equal(cart.items.length, 1)
    assert.equal(cart.item_subtotal, 450)
    html = await (await fetch(origin + '/store/cart', {headers:{cookie}})).text()
    assert.match(html, /PHP\s450\.00/)
    assert.doesNotMatch(html, /Fixture coaster/)
  } finally { await redis.quit(); fixture('disable') }
  const remaining = await variants()
  assert.equal(remaining['MQ103-FIXTURE-COASTER'], undefined)
})

test('an unavailable native cart offers explicit recovery', async () => {
  const all = await variants(), redis = redisClient(), db = new Client({connectionString:backendEnv.DATABASE_URL})
  const cookie = await addCart(all['MQ-DIRECT-TRAY'])
  try {
    const {cartId} = await sessionFor(redis, cookie)
    await db.connect()
    await db.query('update cart set deleted_at=now() where id=$1', [cartId])
    const page = await (await fetch(origin + '/store/cart', {headers:{cookie}})).text()
    assert.match(page, /Cart unavailable/)
    const reset = await post('/store/cart/action', {action:'reset'}, cookie)
    assert.match(reset.headers.get('location'), /notice=reset/)
  } finally { await db.end(); await redis.quit() }
})

test('concurrent completion, interrupted response and retries yield one durable order per cart', async () => {
  const all = await variants(), redis = redisClient()
  try {
    for (const interrupted of [false, true]) {
      const cookie = await addCart(all['MQ-DIRECT-TRAY'])
      const {cartId} = await sessionFor(redis, cookie)
      const prepared = await post('/store/checkout/action', {action:'prepare',...contact}, cookie)
      assert.match(prepared.headers.get('location'), /review/)
      if (interrupted) {
        const controller = new AbortController()
        const sent = fetch(origin + '/store/checkout/action', {method:'POST',redirect:'manual',signal:controller.signal,headers:{origin,'content-type':'application/x-www-form-urlencoded',cookie},body:'action=complete'}).catch(() => null)
        let observed = false
        for (let attempt = 0; attempt < 200; attempt++) {
          const session = await sessionFor(redis, cookie)
          if (session.phase === 'completing') { observed = true; controller.abort(); break }
          if (session.phase === 'complete') break
          await new Promise(resolve => setTimeout(resolve, 5))
        }
        assert.ok(observed, 'interrupted after completion was marked uncertain')
        await sent
      } else {
        const responses = await Promise.all([post('/store/checkout/action', {action:'complete'}, cookie), post('/store/checkout/action', {action:'complete'}, cookie)])
        assert.ok(responses.every(r => r.status === 303))
      }
      let retry
      for (let attempt = 0; attempt < 80; attempt++) {
        retry = await post('/store/checkout/action', {action:'complete'}, cookie)
        if (retry.headers.get('location')?.includes('/confirmation')) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.match(retry.headers.get('location'), /confirmation/)
      const firstHtml = await (await fetch(origin + '/store/confirmation', {headers:{cookie}})).text()
      const refreshed = await (await fetch(origin + '/store/confirmation', {headers:{cookie}})).text()
      assert.match(firstHtml, /Simulated order placed/)
      assert.match(refreshed, /PHP\s460\.00/)
      const nativeRetry = await fetch(`${backend}/store/carts/${cartId}/complete`, {method:'POST',headers:{...storeHeaders,'content-type':'application/json'},body:'{}'})
      const completed = await nativeRetry.json()
      assert.equal(completed.type, 'order')
      assert.equal(completed.order.total, 460)
      assert.deepEqual(await orderCount(cartId), [completed.order.id])
    }
  } finally { await redis.quit() }
})

test('an uncertain completion stays locked when a retry cannot establish the outcome', async () => {
  const all = await variants(), redis = redisClient()
  try {
    const cookie = await addCart(all['MQ-DIRECT-TRAY'])
    const sessionKey = `merqloom:checkout:session:${cookie.split('=')[1]}`
    const session = await sessionFor(redis, cookie)
    session.phase = 'completing'
    session.cartId = 'cart_missing'
    await redis.set(sessionKey, JSON.stringify(session), 'EX', 60)
    const retry = await post('/store/checkout/action', {action:'complete'}, cookie)
    assert.match(retry.headers.get('location'), /uncertain/)
    assert.equal((await sessionFor(redis, cookie)).phase, 'completing')
    const page = await (await fetch(origin + '/store/checkout', {headers:{cookie}})).text()
    assert.match(page, /Check simulated order status/)
    const reset = await post('/store/cart/action', {action:'reset'}, cookie)
    assert.match(reset.headers.get('location'), /uncertain/)
  } finally { await redis.quit() }
})

test('editing checkout refreshes the native payment session to the final cart total', async () => {
  const all = await variants(), redis = redisClient()
  try {
    const cookie = await addCart(all['MQ-DIRECT-TRAY'])
    const {cartId} = await sessionFor(redis, cookie)
    assert.match((await post('/store/checkout/action', {action:'prepare',...contact}, cookie)).headers.get('location'), /review/)
    const edit = await (await fetch(origin + '/store/checkout?edit=1', {headers:{cookie}})).text()
    assert.match(edit, /value="shopper@example\.test"/)
    assert.match(edit, /value="Makati"/)
    let cart = await nativeCart(cartId)
    assert.match((await post('/store/cart/action', {action:'update',line_id:cart.items[0].id,quantity:'2'}, cookie)).headers.get('location'), /updated/)
    assert.match((await post('/store/checkout/action', {action:'prepare',...contact}, cookie)).headers.get('location'), /review/)
    cart = await nativeCart(cartId)
    assert.equal(cart.total, 910)
    assert.equal(cart.payment_collection.amount, cart.total)
    assert.ok(cart.payment_collection.payment_sessions.some(s => s.provider_id === 'pp_system_default' && s.amount === cart.total))
  } finally { await redis.quit() }
})

test('a lost backend response can be retried against the original cart', async () => {
  const all = await variants(), redis = redisClient()
  try {
    const cookie = await addCart(all['MQ-DIRECT-TRAY'])
    const sessionKey = `merqloom:checkout:session:${cookie.split('=')[1]}`
    const session = await sessionFor(redis, cookie)
    assert.match((await post('/store/checkout/action', {action:'prepare',...contact}, cookie)).headers.get('location'), /review/)
    session.phase = 'completing'
    await redis.set(sessionKey, JSON.stringify(session), 'EX', 60)
    const nativeResponse = await fetch(`${backend}/store/carts/${session.cartId}/complete`, {method:'POST',headers:{...storeHeaders,'content-type':'application/json'},body:'{}'})
    const nativeResult = await nativeResponse.json()
    assert.equal(nativeResult.type, 'order')
    const retry = await post('/store/checkout/action', {action:'complete'}, cookie)
    assert.match(retry.headers.get('location'), /confirmation/)
    assert.deepEqual(await orderCount(session.cartId), [nativeResult.order.id])
  } finally { await redis.quit() }
})
