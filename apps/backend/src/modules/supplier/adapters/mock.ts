import { createHash } from 'node:crypto'
import type { SupplierAdapter, SupplierRejection } from './types'
import { isUtcTimestamp } from '../time'

type Fixture = { externalSku: string; title: string; quantity: number }
const fixtures = new Map<string, Fixture[]>([
  ['fictional-north', [
    { externalSku: 'POUCH-NATURAL', title: 'Organizer pouch', quantity: 6 },
    { externalSku: 'POUCH-ZERO', title: 'Unavailable pouch', quantity: 0 },
  ]],
  ['fictional-south', [{ externalSku: 'POUCH-NATURAL', title: 'Organizer pouch', quantity: 3 }]],
])

const rejected = (reason: SupplierRejection) => ({ ok: false as const, reason })
const validText = (value: unknown, limit = 128): value is string =>
  typeof value === 'string' && value.length <= limit && value.trim().length > 0
function validList<Item>(items: readonly Item[], isValidItem: (item: Item) => boolean): boolean {
  if (!Array.isArray(items) || items.length > 100) return false
  for (let index = 0; index < items.length; index++) {
    if (!Object.prototype.hasOwnProperty.call(items, index) || !isValidItem(items[index])) return false
  }
  return true
}
const reference = (supplierCode: string, requestKey: string) =>
  `MOCK-${createHash('sha256').update(JSON.stringify([supplierCode, requestKey])).digest('hex')}`

export const mockSupplierAdapter: SupplierAdapter = {
  getCatalog(supplierCode) {
    if (!validText(supplierCode)) return rejected('INVALID_INPUT')
    const catalog = fixtures.get(supplierCode)
    if (!catalog) return rejected('UNKNOWN_SUPPLIER')
    return { ok: true, value: catalog.map(({ externalSku, title }) => ({ externalSku, title })) }
  },
  getInventory(input) {
    if (!input || !validText(input.supplierCode) || !isUtcTimestamp(input.observedAt) ||
      !validList(input.externalSkus, validText)) return rejected('INVALID_INPUT')
    const catalog = fixtures.get(input.supplierCode)
    if (!catalog) return rejected('UNKNOWN_SUPPLIER')
    const requested = new Set(input.externalSkus)
    return { ok: true, value: catalog.filter(item => requested.has(item.externalSku))
      .map(({ externalSku, quantity }) => ({ externalSku, quantity, observedAt: input.observedAt })) }
  },
  submitFulfillment(input) {
    if (!input || !validText(input.supplierCode) || !validText(input.requestKey, 200) ||
      !validList(input.lines, line =>
        line !== null && typeof line === 'object' && validText(line.externalSku) &&
        Number.isSafeInteger(line.quantity) && line.quantity > 0) ||
      input.lines.length === 0) return rejected('INVALID_INPUT')
    const catalog = fixtures.get(input.supplierCode)
    if (!catalog) return rejected('UNKNOWN_SUPPLIER')
    if (input.lines.some(line => !catalog.some(item => item.externalSku === line.externalSku))) return rejected('UNKNOWN_SKU')
    return { ok: true, value: { supplierCode: input.supplierCode, requestKey: input.requestKey,
      reference: reference(input.supplierCode, input.requestKey), simulated: true } }
  },
  getFulfillmentStatus(input) {
    if (!input || !validText(input.supplierCode)) return rejected('INVALID_INPUT')
    if (!fixtures.has(input.supplierCode)) return rejected('UNKNOWN_SUPPLIER')
    const receipt = input.receipt
    if (!receipt || receipt.supplierCode !== input.supplierCode || !validText(receipt.requestKey, 200) ||
      receipt.simulated !== true || receipt.reference !== reference(input.supplierCode, receipt.requestKey)) return rejected('INVALID_RECEIPT')
    return { ok: true, value: { status: 'accepted', simulated: true } }
  },
}
