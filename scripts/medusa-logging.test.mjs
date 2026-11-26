import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { parseEnv } from 'node:util'
import { test } from 'node:test'

// Capture the real production server's streams in memory; its file transport uses tmpfs.
test('production Medusa checkout diagnostics omit sensitive request and error data', { timeout: 120000 }, async () => {
  const env = parseEnv(readFileSync('apps/storefront/.env.local', 'utf8'))
  const probe = createServer()
  probe.listen(0, '127.0.0.1')
  await once(probe, 'listening')
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const base = `http://127.0.0.1:${port}`
  // When available, exercise the framework's LOG_FILE transport on tmpfs, not disk.
  const ramDir = existsSync('/dev/shm') ? mkdtempSync('/dev/shm/merqloom-log-test-') : undefined
  const logFile = ramDir ? `${ramDir}/framework.log` : ''
  const child = spawn(process.execPath, ['--env-file=../../.env', '../../node_modules/@medusajs/cli/cli.js', 'start', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: 'apps/backend/.medusa/server',
    env: {...process.env, NODE_ENV:'production', MERQLOOM_LOOPBACK_HTTP:'true', MEDUSA_DISABLE_TELEMETRY:'true', LOG_LEVEL:'http', LOG_FILE:logFile},
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const collect = chunk => { output += chunk.toString(); if (output.length > 4_000_000) child.kill('SIGTERM') }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  const canary = 'mq103_log_synthetic_secret'
  const headers = {'x-publishable-api-key':env.MEDUSA_PUBLISHABLE_KEY, 'content-type':'application/json', cookie:`mq_canary=${canary}`, referer:`https://redaction.invalid/${canary}`}
  async function call(path, data, expected = 200) {
    const response = await fetch(base + '/store/' + path, {method:data === undefined ? 'GET' : 'POST', headers, ...(data === undefined ? {} : {body:JSON.stringify(data)})})
    assert.equal(response.status, expected, 'native Store request returned expected status')
    return response.json()
  }
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) break
      try { ready = (await fetch(base + '/health')).ok } catch {}
      if (ready) break
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    assert.ok(ready, 'the separate production Medusa process started')
    output = ''
    const initialFileLength = logFile && existsSync(logFile) ? readFileSync(logFile).length : 0
    const {regions} = await call('regions')
    const region = regions.find(item => item.currency_code === 'php' && item.countries.some(country => country.iso_2 === 'ph'))
    assert.ok(region)
    const {products} = await call(`products?${new URLSearchParams({region_id:region.id, fields:'handle,variants.id,variants.sku'})}`)
    const variant = products.flatMap(item => item.variants).find(item => item.sku === 'MQ-DIRECT-TRAY')
    assert.ok(variant)
    let {cart} = await call('carts', {region_id:region.id})
    const invalidVariant = await fetch(base + `/store/carts/${cart.id}/line-items`, {method:'POST', headers, body:JSON.stringify({variant_id:`variant_${canary}`, quantity:1})})
    assert.ok(invalidVariant.status >= 400 && invalidVariant.status < 500, 'a native variant error is rejected')
    await invalidVariant.arrayBuffer()
    await call(`carts/${cart.id}/line-items`, {variant_id:variant.id, quantity:1})
    const address = {first_name:'SyntheticLogName', last_name:'SyntheticLogFamily', address_1:'99 SyntheticLogStreet', city:'SyntheticLogCity', postal_code:'1987', country_code:'ph'}
    await call(`carts/${cart.id}`, {email:'synthetic-log@example.test', shipping_address:address, billing_address:address})
    const {shipping_options} = await call(`shipping-options?cart_id=${cart.id}`)
    const shipping = shipping_options.find(item => item.name === 'Simulated shipping')
    assert.ok(shipping)
    await call(`carts/${cart.id}/shipping-methods`, {option_id:shipping.id})
    const {payment_collection} = await call('payment-collections', {cart_id:cart.id})
    await call(`payment-collections/${payment_collection.id}/payment-sessions`, {provider_id:'pp_system_default'})
    const completed = await call(`carts/${cart.id}/complete`, {})
    assert.equal(completed.type, 'order')
    const failure = await fetch(base + `/store/carts/${cart.id}/line-items?${canary}`, {method:'POST', headers, body:`{"variant_id":"${canary}"`})
    assert.equal(failure.status, 400, 'malformed JSON exercises Medusa error handling')
    await failure.arrayBuffer()
    await new Promise(resolve => setTimeout(resolve, 100))
    const fileOutput = logFile && existsSync(logFile) ? readFileSync(logFile).subarray(initialFileLength).toString() : ''
    const captured = output + fileOutput
    for (const secret of [cart.id, region.id, variant.id, shipping.id, payment_collection.id, completed.order.id, env.MEDUSA_PUBLISHABLE_KEY, canary, 'SyntheticLogName', 'SyntheticLogFamily', 'SyntheticLogStreet', 'SyntheticLogCity', '1987', 'synthetic-log@example.test', 'redaction.invalid', 'SyntaxError', 'Unexpected end of JSON']) {
      assert.ok(!captured.includes(secret), 'production output does not contain native identifiers, tokens, contact details, URLs, or raw error content')
    }
    assert.ok(!/https?:\/\//.test(captured), 'production output contains no raw URLs')
    assert.ok(!/\b(?:cart|pay_col|payses|variant|prod|reg|order|so|item)_[a-z0-9]+/i.test(captured), 'production output contains no native identifiers')
    const records = output.split('\n').flatMap(line => { try { return [JSON.parse(line)] } catch { return [] } })
    const diagnostics = records.filter(record => record.event === 'medusa_http')
    assert.ok(diagnostics.some(record => record.method === 'POST' && record.route === '/store/carts/:id/complete' && record.status === 200 && record.code === 'HTTP_OK'), `successful completion has a safe diagnostic; observed ${JSON.stringify(diagnostics)}`)
    assert.ok(diagnostics.some(record => record.method === 'POST' && record.route === '/store/carts/:id/line-items' && record.status === 400 && record.code === 'HTTP_CLIENT_ERROR'), 'controlled failure has a safe diagnostic')
  } finally {
    child.kill('SIGTERM')
    if (child.exitCode === null) await Promise.race([once(child, 'exit'), new Promise(resolve => { const timer = setTimeout(resolve, 5000); timer.unref() })])
    if (child.exitCode === null) child.kill('SIGKILL')
    if (ramDir) rmSync(ramDir, {recursive:true, force:true})
  }
})
