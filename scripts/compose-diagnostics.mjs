import { execFileSync } from 'node:child_process'

// Do not print arbitrary process output: only fixed codes and constrained
// HTTP fields from the accepted Medusa logger are safe for CI diagnostics.
const methods = new Set(['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD','OTHER'])
const routes = new Set(['/store/regions','/store/products','/store/products/:id','/store/carts','/store/carts/:id','/store/carts/:id/line-items','/store/carts/:id/line-items/:line_id','/store/carts/:id/shipping-methods','/store/carts/:id/complete','/store/shipping-options','/store/payment-collections','/store/payment-collections/:id/payment-sessions','/store/:other'])
const codes = new Set(['HTTP_OK','HTTP_CLIENT_ERROR','HTTP_SERVER_ERROR','MEDUSA_ERROR','MEDUSA_WARNING','MEDUSA_FATAL'])
const startupCodes = new Set(['MQ106_INITIALIZING','MQ106_MIGRATION_FAILED','MQ106_KEY_UNAVAILABLE','MQ106_DEPENDENCIES_UNAVAILABLE','MQ106_STORE_DEPENDENCIES_UNAVAILABLE','MQ106_BACKEND_STARTING','MQ106_STOREFRONT_STARTING'])
try {
  const logs = execFileSync('docker',['compose','logs','--no-color','--tail=200','backend','storefront'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})
  for (const line of logs.split('\n')) {
    const message = line.replace(/^[^|]*\|\s*/, '')
    const startup = message.match(/^(MQ106_[A-Z_]+):/)
    if (startup && startupCodes.has(startup[1])) { console.log(startup[1]); continue }
    try {
      const record = JSON.parse(message)
      if (record.event === 'medusa_internal' && codes.has(record.code)) console.log(JSON.stringify({event:record.event,code:record.code}))
      if (record.event === 'medusa_http' && methods.has(record.method) && routes.has(record.route) && Number.isInteger(record.status) && record.status >= 100 && record.status <= 599 && codes.has(record.code)) {
        console.log(JSON.stringify({event:record.event,method:record.method,route:record.route,status:record.status,code:record.code}))
      }
    } catch {}
  }
} catch { console.error('MQ106_DIAGNOSTICS_UNAVAILABLE') }
