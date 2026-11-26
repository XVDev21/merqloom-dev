import 'server-only'

import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import Redis from 'ioredis'

export type OrderSummary = {
  displayId: number
  items: { title: string; variant: string; quantity: number; total: number }[]
  itemSubtotal: number
  shippingTotal: number
  taxTotal: number
  total: number
}
export type Session = {
  cartId?: string
  phase: 'open' | 'ready' | 'completing' | 'complete'
  order?: OrderSummary
}

const cookieName = 'merqloom_session'
const ttl = 60 * 60 * 24 * 30
const globalRedis = globalThis as typeof globalThis & { merqloomRedis?: Redis }

function redis() {
  if (!process.env.MERQLOOM_REDIS_URL) throw new Error('Session store is unavailable')
  if (!globalRedis.merqloomRedis) {
    const client = new Redis(process.env.MERQLOOM_REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 5000 })
    client.on('error', () => {})
    globalRedis.merqloomRedis = client
  }
  return globalRedis.merqloomRedis
}
const key = (token: string) => `merqloom:checkout:session:${token}`

export async function readSession() {
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return { token: undefined, session: undefined, expired: false }
  if (!/^[a-f0-9]{64}$/.test(token)) return { token: undefined, session: undefined, expired: true }
  const data = await redis().get(key(token))
  return { token, session: data ? JSON.parse(data) as Session : undefined, expired: !data }
}

export async function createSession() {
  const token = randomBytes(32).toString('hex')
  const session: Session = { phase: 'open' }
  await saveSession(token, session)
  ;(await cookies()).set(cookieName, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.MERQLOOM_LOOPBACK_HTTP !== 'true',
    path: '/', maxAge: ttl,
  })
  return { token, session }
}

export async function saveSession(token: string, session: Session) {
  await redis().set(key(token), JSON.stringify(session), 'EX', ttl)
}

export async function clearSession(token?: string) {
  if (token) await redis().del(key(token))
  ;(await cookies()).delete(cookieName)
}

// A persisted phase and this per-session lock prevent cart edits while completion is uncertain.
export async function withSessionLock<T>(token: string, operation: () => Promise<T>) {
  const lock = `${key(token)}:lock`
  const owner = randomBytes(24).toString('hex')
  const acquired = await redis().set(lock, owner, 'EX', 120, 'NX')
  if (!acquired) return { busy: true as const }
  try {
    return { busy: false as const, value: await operation() }
  } finally {
    await redis().eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", 1, lock, owner)
  }
}
