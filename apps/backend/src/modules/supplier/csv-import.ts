import { parse } from 'csv-parse/sync'
import { compareUtc, isUtcTimestamp } from './time'

export type SupplierCsvRow = { row: number; externalSku: string; variantSku: string; quantity: number; observedAt: string }
export type CsvErrorCode = 'INVALID_UTF8' | 'FILE_TOO_LARGE' | 'RECORD_TOO_LARGE' | 'TOO_MANY_ROWS' |
  'INVALID_HEADER' | 'INVALID_CSV' | 'INVALID_SKU' | 'INVALID_QUANTITY' | 'INVALID_TIMESTAMP' |
  'FUTURE_OBSERVATION' | 'DUPLICATE_EXTERNAL_SKU' | 'DUPLICATE_VARIANT_SKU'
export type CsvResult = { ok: true; rows: SupplierCsvRow[] } | { ok: false; code: CsvErrorCode; row?: number }

const header = ['external_sku', 'variant_sku', 'quantity', 'observed_at']
const skuPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const failure = (code: CsvErrorCode, row?: number): CsvResult => ({ ok:false, code, ...(row && { row }) })

export function parseSupplierCsv(csv: unknown, now: Date): CsvResult {
  if (typeof csv !== 'string' || Buffer.from(csv, 'utf8').toString('utf8') !== csv) return failure('INVALID_UTF8')
  if (Buffer.byteLength(csv, 'utf8') > 256 * 1024) return failure('FILE_TOO_LARGE')
  if (!(now instanceof Date) || !Number.isFinite(now.valueOf())) return failure('INVALID_TIMESTAMP')
  if (/\r(?!\n)/.test(csv)) return failure('INVALID_CSV')
  const nowUtc = now.toISOString()
  let records: { record: string[]; raw: string }[]
  try {
    // The parser's type overload omits its documented raw/info result shape.
    records = parse(csv, { bom:true, raw:true, info:true, relax_column_count:true, max_record_size:1024, to:102 }) as unknown as typeof records
  } catch (error) {
    const issue = error as { code?: string; lines?: number }
    return failure(issue.code === 'CSV_MAX_RECORD_SIZE' ? 'RECORD_TOO_LARGE' : 'INVALID_CSV',
      Math.min(102, Math.max(1, issue.lines ?? 1)))
  }
  if (!records.length || records[0].record.length !== header.length ||
    records[0].record.some((field, index) => field !== header[index])) return failure('INVALID_HEADER', 1)
  if (records.length > 101) return failure('TOO_MANY_ROWS')
  const rows: SupplierCsvRow[] = [], externalSkus = new Set<string>(), variantSkus = new Set<string>()
  for (const [index, item] of records.slice(1).entries()) {
    const row = index + 2
    if (Buffer.byteLength(item.raw.replace(/\r?\n$/, ''), 'utf8') > 1024) return failure('RECORD_TOO_LARGE', row)
    if (item.record.length !== 4) return failure('INVALID_CSV', row)
    const [externalSku, variantSku, quantityText, observedAt] = item.record.map(field => field.trim())
    if (!skuPattern.test(externalSku) || !skuPattern.test(variantSku)) return failure('INVALID_SKU', row)
    if (!/^\d+$/.test(quantityText) || Number(quantityText) > 9999) return failure('INVALID_QUANTITY', row)
    if (!isUtcTimestamp(observedAt)) return failure('INVALID_TIMESTAMP', row)
    if (compareUtc(observedAt, nowUtc) > 0) return failure('FUTURE_OBSERVATION', row)
    if (externalSkus.has(externalSku)) return failure('DUPLICATE_EXTERNAL_SKU', row)
    if (variantSkus.has(variantSku)) return failure('DUPLICATE_VARIANT_SKU', row)
    externalSkus.add(externalSku)
    variantSkus.add(variantSku)
    rows.push({ row, externalSku, variantSku, quantity:Number(quantityText), observedAt })
  }
  return { ok:true, rows }
}
