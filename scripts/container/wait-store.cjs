const { readFile } = require('node:fs/promises')
const Redis = require('../../apps/storefront/node_modules/ioredis')

async function ready() {
  const redis = new Redis(process.env.MERQLOOM_REDIS_URL, { lazyConnect: true, connectTimeout: 2000, maxRetriesPerRequest: 1, retryStrategy: () => null })
  redis.on('error', () => {})
  try {
    const key = (await readFile('/run/merqloom/publishable-key', 'utf8')).trim()
    if (!/^pk_[a-z0-9]+$/i.test(key)) return false
    await redis.connect()
    if (await redis.ping() !== 'PONG') return false
    const response = await fetch(new URL('/store/regions', process.env.MEDUSA_BACKEND_URL), { headers: { 'x-publishable-api-key': key }, signal: AbortSignal.timeout(3000) })
    if (!response.ok) return false
    const { regions } = await response.json()
    return Array.isArray(regions) && regions.some(region => region.currency_code === 'php')
  } catch { return false } finally { redis.disconnect() }
}

;(async () => {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (await ready()) return
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  console.error('MQ106_STORE_DEPENDENCIES_UNAVAILABLE: Store API or Redis did not become ready.')
  process.exitCode = 1
})()
