import type { MedusaContainer } from '@medusajs/framework'
import { database, type ImportRun } from './import-audit'
import { decideFreshness, type RefreshStatus } from './freshness'
import { singleManagedItem } from './native-inventory'

export async function getSupplierEligibility(container:MedusaContainer, input:{
  supplierId:string; mappingId:string; now?:Date; thresholdMs?:number
}) {
  const db = database(container)
  const links = await db('supplier_mapping as m')
    .join('supplier as s', 's.id', 'm.supplier_id')
    .join('product_product_variant_supplier_supplier_mapping as l', 'l.supplier_mapping_id', 'm.id')
    .join('product_variant as v', 'v.id', 'l.product_variant_id')
    .join('product as p', 'p.id', 'v.product_id')
    .where({'m.id':input.mappingId, 'm.supplier_id':input.supplierId})
    .whereNull('m.deleted_at').whereNull('s.deleted_at').whereNull('l.deleted_at').whereNull('v.deleted_at').whereNull('p.deleted_at')
    .select('v.id', 'v.manage_inventory', 'p.metadata')
  let mappingLinked = links.length === 1 && links[0].manage_inventory === true &&
    links[0].metadata?.source === 'supplier' && links[0].metadata?.synthetic === true
  if (mappingLinked) {
    const competitors = await db('product_product_variant_supplier_supplier_mapping').where({product_variant_id:links[0].id})
      .whereNull('deleted_at').select('supplier_mapping_id')
    mappingLinked = competitors.length === 1 && competitors[0].supplier_mapping_id === input.mappingId &&
      Boolean(await singleManagedItem(db, links[0].id))
  }
  const active = await db<ImportRun>('supplier_import_run').where({supplier_id:input.supplierId})
    .whereNull('deleted_at').whereIn('status',['running','reconciliation']).first()
  const latest = await db<ImportRun>('supplier_import_run').where({supplier_id:input.supplierId})
    .whereNull('deleted_at').whereRaw('targets @> ?::jsonb',[JSON.stringify([input.mappingId])])
    .orderBy('created_at','desc').orderBy('id','desc').first()
  const observation = await db('supplier_observation as o').join('supplier_import_run as r','r.id','o.run_id')
    .where({'o.mapping_id':input.mappingId, 'r.supplier_id':input.supplierId, 'r.status':'succeeded'})
    .whereNull('o.deleted_at').whereNull('r.deleted_at').orderBy('r.completed_at','desc').orderBy('r.id','desc')
    .select('o.quantity','o.observed_at').first()
  const latestRefresh:RefreshStatus | undefined = active?.status === 'reconciliation' ? 'reconciliation' :
    active?.status === 'running' && (!active.targets.length || active.targets.includes(input.mappingId)) ? 'running' : latest?.status
  const configured = process.env.SUPPLIER_FRESHNESS_MS
  const thresholdMs = input.thresholdMs ?? (configured === undefined ? undefined : Number(configured))
  return decideFreshness({ mappingLinked, latestRefresh, now:input.now ?? new Date(), thresholdMs,
    ...(observation && {observation:{quantity:Number(observation.quantity), observedAt:observation.observed_at}}) })
}
