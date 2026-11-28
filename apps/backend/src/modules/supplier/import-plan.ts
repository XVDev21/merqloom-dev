import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import type { SupplierCsvRow } from './csv-import'
import { database, type Database, type ImportPlanItem } from './import-audit'
import { compareUtc } from './time'
import { singleManagedItem } from './native-inventory'

export class ImportRejected extends MedusaError {
  constructor(public readonly importCode:string, public readonly row?:number) {
    super(MedusaError.Types.INVALID_DATA, 'Supplier import rejected.')
  }
}

export async function supplierLocation(container:MedusaContainer, supplierId:string):Promise<string> {
  const db = database(container)
  const supplier = await db('supplier').where({id:supplierId, code:'fictional-north'}).whereNull('deleted_at').first()
  if (!supplier) throw new ImportRejected('SUPPLIER_UNAVAILABLE')
  const locations = await db('stock_location').where({name:'Fictional North supplier stock'}).whereNull('deleted_at')
    .whereRaw("metadata->>'supplier_code' = ? and metadata->>'synthetic' = ?",['fictional-north','true'])
  if (locations.length !== 1) throw new ImportRejected('LOCATION_UNAVAILABLE')
  const linkedChannel = await db('sales_channel_stock_location').where({stock_location_id:locations[0].id}).whereNull('deleted_at').first()
  if (linkedChannel) throw new ImportRejected('LOCATION_UNAVAILABLE')
  return locations[0].id
}

export async function existingTargets(db:Database, supplierId:string, rows:SupplierCsvRow[]):Promise<string[]> {
  if (!rows.length) return []
  const matches = await db('supplier_mapping').where({supplier_id:supplierId}).whereNull('deleted_at')
    .whereIn('external_sku', rows.map(row => row.externalSku)).select('id')
  return matches.map(item => item.id)
}

export async function preflightImport(container:MedusaContainer, supplierId:string, locationId:string, rows:SupplierCsvRow[]):Promise<ImportPlanItem[]> {
  const db = database(container), query = container.resolve(ContainerRegistrationKeys.QUERY)
  const plan:ImportPlanItem[] = []
  for (const row of rows) {
    // MQ-202 admits only the released fictional supplier fixture.
    if (row.variantSku !== 'MQ-SUPPLIER-POUCH') throw new ImportRejected('VARIANT_UNAVAILABLE', row.row)
    const {data:variants} = await query.graph({entity:'product_variant', fields:['id','sku','manage_inventory','product.metadata'], filters:{sku:row.variantSku}})
    if (variants.length !== 1 || !variants[0].manage_inventory || variants[0].product?.metadata?.source !== 'supplier' ||
      variants[0].product?.metadata?.synthetic !== true) throw new ImportRejected('VARIANT_UNAVAILABLE', row.row)
    const variantId = variants[0].id
    const inventoryItemId = await singleManagedItem(db, variantId)
    if (!inventoryItemId) throw new ImportRejected('INVENTORY_AMBIGUOUS', row.row)
    const mapping = await db('supplier_mapping').where({supplier_id:supplierId, external_sku:row.externalSku}).first()
    if (mapping?.deleted_at) throw new ImportRejected('MAPPING_RECONCILIATION', row.row)
    const links = await db('product_product_variant_supplier_supplier_mapping as l')
      .join('supplier_mapping as m','m.id','l.supplier_mapping_id').where({'l.product_variant_id':variantId})
      .whereNull('l.deleted_at').select('m.id','m.supplier_id','m.deleted_at')
    if (links.some(link => link.deleted_at || link.supplier_id !== supplierId || link.id !== mapping?.id)) {
      throw new ImportRejected('MAPPING_CONFLICT', row.row)
    }
    let sameObservation = false
    if (mapping) {
      const ownLinks = await db('product_product_variant_supplier_supplier_mapping')
        .where({supplier_mapping_id:mapping.id}).whereNull('deleted_at').select('product_variant_id')
      if (ownLinks.length !== 1 || ownLinks[0].product_variant_id !== variantId) throw new ImportRejected('MAPPING_CONFLICT', row.row)
      const previous = await db('supplier_observation as o').join('supplier_import_run as r','r.id','o.run_id')
        .where({'o.mapping_id':mapping.id, 'r.status':'succeeded'}).whereNull('o.deleted_at').whereNull('r.deleted_at')
        .orderBy('r.completed_at','desc').orderBy('r.id','desc').select('o.quantity','o.observed_at').first()
      if (previous) {
        const comparison = compareUtc(row.observedAt, previous.observed_at)
        if (comparison < 0) throw new ImportRejected('OLDER_OBSERVATION', row.row)
        if (comparison === 0 && row.quantity !== Number(previous.quantity)) throw new ImportRejected('TIMESTAMP_CONFLICT', row.row)
        sameObservation = comparison === 0
      }
    }
    const levels = await db('inventory_level').where({inventory_item_id:inventoryItemId, location_id:locationId})
      .whereNull('deleted_at').select('id','stocked_quantity','reserved_quantity')
    if (levels.length > 1) throw new ImportRejected('INVENTORY_RECONCILIATION', row.row)
    const level = levels[0]
    if (level && row.quantity < Number(level.reserved_quantity)) throw new ImportRejected('RESERVATION_CONFLICT', row.row)
    if (sameObservation && (!level || Number(level.stocked_quantity) !== row.quantity)) throw new ImportRejected('STOCK_DRIFT', row.row)
    plan.push({row:row.row, externalSku:row.externalSku, variantId, inventoryItemId, locationId, quantity:row.quantity,
      observedAt:row.observedAt, sameObservation, mappingId:mapping?.id ?? null, mappingStage:mapping ? 'existing' : 'none',
      levelId:level?.id ?? null, previousStock:level ? Number(level.stocked_quantity) : null, stockStage:'none'})
  }
  return plan
}
