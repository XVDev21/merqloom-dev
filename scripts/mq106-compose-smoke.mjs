import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { request } from 'node:http'

// This creates a real simulated order; it is permitted only in a designated
// disposable Compose project. The publishable key never enters output or Git.
assert.equal(process.env.MERQLOOM_TEST_DISPOSABLE, 'yes', 'Select a disposable project')
const compose = (...args) => execFileSync('docker', ['compose', ...args], { encoding:'utf8', stdio:['ignore','pipe','pipe'] }).trim()
const config = JSON.parse(compose('config','--format','json'))
assert.ok(config.name && config.name !== 'merqloom-dev', 'Select a separate disposable project')
const backend = process.env.MQ106_BACKEND_URL ?? 'http://127.0.0.1:19000'
const origin = process.env.MQ106_STOREFRONT_URL ?? 'http://127.0.0.1:18000'
for (const service of ['postgres','redis','backend','storefront']) {
  const id = compose('ps','-q',service)
  assert.ok(id, 'Disposable service is running')
  const owner = execFileSync('docker',['inspect','--format','{{ index .Config.Labels "com.docker.compose.project" }}',id],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
  assert.ok(owner === config.name, 'Disposable service belongs to the selected project')
}
for (const [service, port, value] of [['backend','9000',backend],['storefront','8000',origin]]) {
  const mapped = compose('port',service,port)
  const url = new URL(value)
  assert.ok(/^127\.0\.0\.1:[0-9]+$/.test(mapped) && url.origin === `http://${mapped}` && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'Smoke endpoint must match the selected disposable container')
}
const key = compose('exec','-T','backend','cat','/run/merqloom/publishable-key')
assert.ok(/^pk_[a-z0-9]+$/i.test(key), 'Disposable Store key is available')
const logStart = new Date().toISOString()
const logCanary = `synthetic_mq106_${randomBytes(12).toString('hex')}`
const probe = await fetch(`${origin}/store/checkout?probe=${logCanary}`, {redirect:'manual'})
await probe.arrayBuffer()
async function checkWebSocket(url, browserOrigin, protocol) {
  await new Promise((resolve, reject) => {
    const req = request(url, {headers:{origin:browserOrigin, connection:'Upgrade', upgrade:'websocket', 'sec-websocket-version':'13', 'sec-websocket-key':randomBytes(16).toString('base64'), ...(protocol && {'sec-websocket-protocol':protocol})}})
    req.on('upgrade', (_response, socket) => { socket.destroy(); resolve() })
    req.on('response', response => { response.resume(); reject(new Error('Development hot reload WebSocket was refused')) })
    req.on('error', () => reject(new Error('Development hot reload WebSocket was refused')))
    req.setTimeout(5000, () => req.destroy())
    req.end()
  })
}
await checkWebSocket(`${origin}/_next/hmr?id=mq106`, origin)
const adminClient = await (await fetch(`${backend}/app/@vite/client`)).text()
const adminToken = adminClient.match(/const wsToken = "([A-Za-z0-9_-]+)"/)?.[1]
const adminPort = compose('port','backend','24678')
assert.ok(adminToken && /^127\.0\.0\.1:[0-9]+$/.test(adminPort), 'Admin hot reload is configured for the disposable project')
await checkWebSocket(`http://${adminPort}/app/?token=${adminToken}`, backend, 'vite-hmr')
async function native(path) {
  const response = await fetch(`${backend}/store/${path}`, {headers:{'x-publishable-api-key':key}})
  assert.equal(response.status, 200, 'Native Store request succeeded')
  return response.json()
}
async function form(path, fields, cookie) {
  return fetch(origin + path, {method:'POST', redirect:'manual', headers:{origin, 'content-type':'application/x-www-form-urlencoded', ...(cookie && {cookie})}, body:new URLSearchParams(fields)})
}
function redirectTo(response, path) {
  assert.equal(response.status, 303, 'Store form redirected')
  let target
  try { target = new URL(response.headers.get('location'), origin) } catch { throw new Error('Store returned an invalid redirect') }
  assert.ok(target.origin === origin && target.pathname === path, 'Store redirected within the selected project')
  return target
}
const {regions} = await native('regions')
const region = regions.find(item => item.currency_code === 'php' && item.countries.some(country => country.iso_2 === 'ph'))
assert.ok(region, 'Philippine PHP region is available')
const {products} = await native(`products?${new URLSearchParams({region_id:region.id, fields:'handle,metadata,variants.id,variants.sku,variants.inventory_quantity'})}`)
const product = products.find(item => item.variants.some(variant => variant.sku === 'MQ-DIRECT-TRAY'))
const variant = product?.variants.find(item => item.sku === 'MQ-DIRECT-TRAY')
assert.ok(product?.metadata?.source === 'direct' && variant?.inventory_quantity >= 1, 'Direct tray is available')
const added = await form('/store/cart/action', {action:'add',handle:product.handle,variant_id:variant.id,quantity:'1'})
assert.ok(redirectTo(added, '/store/cart').searchParams.get('notice') === 'updated', 'Cart was updated')
const cookie = added.headers.get('set-cookie')?.split(';')[0]
assert.ok(cookie, 'Session cookie was issued')
const prepared = await form('/store/checkout/action', {action:'prepare',email:'compose@example.test',first_name:'Demo',last_name:'Shopper',address_1:'1 Fictional Street',city:'Makati',postal_code:'1200'}, cookie)
const reviewUrl = redirectTo(prepared, '/store/checkout')
assert.ok(reviewUrl.searchParams.get('review') === '1', 'Order is ready for review')
const review = await (await fetch(reviewUrl, {headers:{cookie},redirect:'manual'})).text()
assert.ok(review.includes('Simulated payment and simulated shipping'), 'Review discloses simulation')
const completed = await form('/store/checkout/action', {action:'complete'}, cookie)
const confirmationUrl = redirectTo(completed, '/store/confirmation')
const confirmation = await (await fetch(confirmationUrl, {headers:{cookie},redirect:'manual'})).text()
assert.ok(confirmation.includes('Simulated order placed') && /PHP\s460\.00/.test(confirmation), 'Native simulated order was confirmed')
// Read identifiers into memory only, to check the actual process logs without
// printing any potentially sensitive checkout data in CI output.
const links = compose('exec','-T','postgres','psql','-U','merqloom','-d','merqloom','-Atc','select oc.cart_id, oc.order_id from order_cart oc join "order" o on o.id=oc.order_id where oc.deleted_at is null order by o.created_at desc limit 1').split('|')
assert.equal(links.length, 2, 'A native cart and order were linked')
await new Promise(resolve => setTimeout(resolve, 250))
const logs = compose('logs','--no-color',`--since=${logStart}`,'backend','storefront')
for (const value of [logCanary, adminToken, key, cookie.split('=')[1], region.id, variant.id, ...links, 'compose@example.test', '1 Fictional Street']) {
  assert.ok(value && !logs.includes(value), 'Application logs omit checkout identifiers, contact fields and tokens')
}
console.log('MQ106_CHECKOUT_PASSED: Containerized Store created one simulated PHP order.')
