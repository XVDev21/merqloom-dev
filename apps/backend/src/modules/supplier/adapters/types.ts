export type SupplierRejection = 'INVALID_INPUT' | 'UNKNOWN_SUPPLIER' | 'UNKNOWN_SKU' | 'INVALID_RECEIPT'
export type SupplierResult<T> = { ok: true; value: T } | { ok: false; reason: SupplierRejection }

export type CatalogItem = { externalSku: string; title: string }
export type InventoryObservation = { externalSku: string; quantity: number; observedAt: string }
export type FulfillmentLine = { externalSku: string; quantity: number }
export type MockReceipt = { supplierCode: string; requestKey: string; reference: string; simulated: true }

export interface SupplierAdapter {
  getCatalog(supplierCode: string): SupplierResult<CatalogItem[]>
  getInventory(input: { supplierCode: string; externalSkus: string[]; observedAt: string }): SupplierResult<InventoryObservation[]>
  submitFulfillment(input: { supplierCode: string; requestKey: string; lines: FulfillmentLine[] }): SupplierResult<MockReceipt>
  getFulfillmentStatus(input: { supplierCode: string; receipt: MockReceipt }): SupplierResult<{ status: 'accepted'; simulated: true }>
}
