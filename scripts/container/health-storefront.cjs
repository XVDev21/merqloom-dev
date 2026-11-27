;(async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/store', { signal: AbortSignal.timeout(5000) })
    const html = await response.text()
    if (!response.ok || !html.includes('Demo catalog') || html.includes('The Store is temporarily unavailable')) process.exitCode = 1
  } catch { process.exitCode = 1 }
})()
