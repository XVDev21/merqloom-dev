import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { safeLogger } from './src/lib/safe-logger'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  logger: safeLogger,
  modules: [{ resolve:'./src/modules/supplier' }],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    // The local start command binds only to 127.0.0.1 and serves plain HTTP.
    cookieOptions: process.env.MERQLOOM_LOOPBACK_HTTP === 'true'
      ? { secure: false, sameSite: 'lax', httpOnly: true }
      : undefined,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
