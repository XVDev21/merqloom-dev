/** @type {import('next').NextConfig} */
const config = {
  // Development request and browser-console logs can contain checkout data.
  logging: { incomingRequests: false, serverFunctions: false, browserToTerminal: false },
  // The Compose dev server listens on all container interfaces but is
  // published only on the host's loopback address.
  ...(process.env.MERQLOOM_LOOPBACK_HTTP === 'true' ? { allowedDevOrigins: ['127.0.0.1'] } : {}),
}

export default config
