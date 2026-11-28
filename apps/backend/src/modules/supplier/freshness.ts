import { compareUtc, isUtcTimestamp } from './time'

export type RefreshStatus = 'running' | 'succeeded' | 'rejected' | 'failed' | 'reconciliation'
export type FreshnessReason = 'FRESH' | 'STALE' | 'UNKNOWN' | 'OUT_OF_STOCK' | 'FUTURE' |
  'REFRESH_FAILED' | 'REFRESH_PENDING' | 'RECONCILIATION' | 'MAPPING_UNAVAILABLE' | 'INVALID_CONFIGURATION'
export type FreshnessDecision = { eligible: boolean; reason: FreshnessReason; observedAt?: string }
type FreshnessInput = {
  mappingLinked: boolean
  latestRefresh?: RefreshStatus
  observation?: { quantity: number; observedAt: string }
  now: Date
  thresholdMs?: number
}

export function decideFreshness(input: FreshnessInput): FreshnessDecision {
  const threshold = input.thresholdMs ?? 15 * 60 * 1000
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.valueOf()) || !Number.isSafeInteger(threshold) || threshold <= 0 ||
    !Number.isFinite(new Date(input.now.valueOf() - threshold).valueOf())) return { eligible:false, reason:'INVALID_CONFIGURATION' }
  const observedAt = input.observation?.observedAt
  const timestamp = isUtcTimestamp(observedAt) ? { observedAt } : {}
  const reject = (reason: FreshnessReason): FreshnessDecision => ({ eligible:false, reason, ...timestamp })
  if (!input.mappingLinked) return reject('MAPPING_UNAVAILABLE')
  if (input.latestRefresh === 'reconciliation') return reject('RECONCILIATION')
  if (input.latestRefresh === 'running') return reject('REFRESH_PENDING')
  if (input.latestRefresh === 'failed' || input.latestRefresh === 'rejected') return reject('REFRESH_FAILED')
  if (input.latestRefresh !== 'succeeded' || !observedAt || !isUtcTimestamp(observedAt) ||
    !Number.isSafeInteger(input.observation?.quantity) || input.observation!.quantity < 0) return reject('UNKNOWN')
  if (compareUtc(observedAt, input.now.toISOString()) > 0) return reject('FUTURE')
  if (compareUtc(observedAt, new Date(input.now.valueOf() - threshold).toISOString()) <= 0) return reject('STALE')
  if (input.observation!.quantity === 0) return reject('OUT_OF_STOCK')
  return { eligible:true, reason:'FRESH', observedAt }
}
