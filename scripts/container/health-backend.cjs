const { readFileSync } = require('node:fs')
;(async () => {
  try {
    const key = readFileSync('/run/merqloom/publishable-key', 'utf8').trim()
    const health = await fetch('http://127.0.0.1:9000/health', { signal: AbortSignal.timeout(3000) })
    const response = await fetch('http://127.0.0.1:9000/store/regions', { headers: { 'x-publishable-api-key': key }, signal: AbortSignal.timeout(3000) })
    const { regions } = await response.json()
    if (!health.ok || !response.ok || !Array.isArray(regions) || !regions.some(region => region.currency_code === 'php')) process.exitCode = 1
  } catch { process.exitCode = 1 }
})()
