import { randomUUID } from 'node:crypto'
import type { Logger } from '@medusajs/framework/types'

// Framework messages and errors can include request bodies, URLs, and identifiers.
// Never pass their contents to a transport; HTTP diagnostics are emitted separately.
function internal(code: 'MEDUSA_ERROR' | 'MEDUSA_WARNING' | 'MEDUSA_FATAL') {
  process.stdout.write(`${JSON.stringify({ event: 'medusa_internal', code })}\n`)
}

export const safeLogger: Logger = {
  shouldLog: level => level === 'error' || level === 'warn',
  setLogLevel: () => {},
  unsetLogLevel: () => {},
  activity: () => randomUUID(),
  progress: () => {},
  error: () => internal('MEDUSA_ERROR'),
  failure: () => { internal('MEDUSA_ERROR'); return undefined },
  success: () => ({}),
  silly: () => {},
  debug: () => {},
  verbose: () => {},
  http: () => {},
  info: () => {},
  warn: () => internal('MEDUSA_WARNING'),
  log: () => {},
  panic: () => { internal('MEDUSA_FATAL'); process.exit(1) },
}
