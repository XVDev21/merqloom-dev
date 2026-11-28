const utcPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/

export function isUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1024) return false
  const match = utcPattern.exec(value)
  if (!match) return false
  const time = Date.parse(`${match[1]}Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === match[1]
}

// Compare the complete fractional second, including precision beyond JavaScript Date.
export function compareUtc(left: string, right: string): number {
  const a = utcPattern.exec(left)!, b = utcPattern.exec(right)!
  if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1
  const aFraction = a[2] ?? '', bFraction = b[2] ?? ''
  const width = Math.max(aFraction.length, bFraction.length)
  const aPadded = aFraction.padEnd(width, '0'), bPadded = bFraction.padEnd(width, '0')
  return aPadded === bPadded ? 0 : aPadded < bPadded ? -1 : 1
}
