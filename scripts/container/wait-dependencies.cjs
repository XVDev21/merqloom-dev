const { Client } = require('../../apps/storefront/node_modules/pg')
const Redis = require('../../apps/storefront/node_modules/ioredis')

async function ready() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 2000 })
  const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 2000, maxRetriesPerRequest: 1, retryStrategy: () => null })
  redis.on('error', () => {})
  try {
    await db.connect()
    await db.query('select 1')
    await redis.connect()
    return await redis.ping() === 'PONG'
  } catch { return false } finally { await db.end().catch(() => {}); redis.disconnect() }
}

;(async () => {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (await ready()) return
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  console.error('MQ106_DEPENDENCIES_UNAVAILABLE: PostgreSQL or Redis did not become ready.')
  process.exitCode = 1
})()
