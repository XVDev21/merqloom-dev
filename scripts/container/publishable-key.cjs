const { Client } = require('../../apps/storefront/node_modules/pg')
const { mkdir, rename, writeFile } = require('node:fs/promises')

;(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 })
  try {
    await db.connect()
    const { rows } = await db.query("select token from api_key where title='Default Publishable API Key' and type='publishable' and revoked_at is null and deleted_at is null")
    if (rows.length !== 1 || !/^pk_[a-z0-9]+$/i.test(rows[0].token)) throw new Error('key unavailable')
    await mkdir('/run/merqloom', { recursive: true })
    await writeFile('/run/merqloom/publishable-key.tmp', rows[0].token, { mode: 0o644 })
    await rename('/run/merqloom/publishable-key.tmp', '/run/merqloom/publishable-key')
  } catch {
    console.error('MQ106_KEY_UNAVAILABLE: The seeded Store key could not be loaded.')
    process.exitCode = 1
  } finally { await db.end().catch(() => {}) }
})()
