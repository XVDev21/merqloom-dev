import type { MedusaContainer } from '@medusajs/framework'
import type { ILockingModule } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, generateEntityId, MedusaError, Modules } from '@medusajs/framework/utils'
import { createInventoryLevelsWorkflow, deleteInventoryLevelsWorkflow, updateInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'
import { createSupplierMappingWorkflow } from '../../workflows/create-supplier-mapping'
import { SUPPLIER_MODULE } from '.'
import SupplierModuleService from './service'
import { database, getImportRun, updateImport, type ImportPlanItem, type ImportRun } from './import-audit'
import { ImportRejected, supplierLocation } from './import-plan'
import { singleManagedItem } from './native-inventory'

const mappingLink = (item:ImportPlanItem) => ({
  [Modules.PRODUCT]:{product_variant_id:item.variantId},
  [SUPPLIER_MODULE]:{supplier_mapping_id:item.mappingId!},
})
const ensureLock = (signal?:AbortSignal) => { if (signal?.aborted) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Import lock unavailable') }
export class ImportLockLost extends MedusaError {
  constructor() { super(MedusaError.Types.UNEXPECTED_STATE, 'Import lock lost.') }
}

async function withInventoryLocks<T>(container:MedusaContainer, plan:ImportPlanItem[], job:(signal?:AbortSignal) => Promise<T>) {
  const keys = [...new Set(plan.map(item => item.inventoryItemId))].sort()
  if (!keys.length) return job()
  let lost = false
  try {
    return await container.resolve<ILockingModule>(Modules.LOCKING).execute(keys, async signal => {
      signal?.addEventListener('abort', () => { lost = true }, {once:true})
      if (signal?.aborted) lost = true
      return job(signal)
    }, {timeout:10, expire:60})
  } catch (error) {
    if (lost) throw new ImportLockLost()
    throw error
  }
}

async function levelFor(container:MedusaContainer, item:ImportPlanItem) {
  const levels = await database(container)('inventory_level').where({inventory_item_id:item.inventoryItemId, location_id:item.locationId})
    .whereNull('deleted_at').select('id','stocked_quantity','reserved_quantity','incoming_quantity')
  if (levels.length > 1) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Inventory level ambiguous')
  return levels[0]
}

async function savePlan(container:MedusaContainer, run:ImportRun) {
  await updateImport(database(container), run.id, {plan:run.plan, targets:run.targets})
}

export async function applyImport(container:MedusaContainer, runId:string) {
  const db = database(container)
  const run = await getImportRun(db, runId)
  if (!run || run.status !== 'running') throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Import unavailable')
  await withInventoryLocks(container, run.plan, async signal => {
    ensureLock(signal)
    if (run.plan.length && await supplierLocation(container, run.supplier_id) !== run.plan[0].locationId) {
      throw new ImportRejected('LOCATION_UNAVAILABLE')
    }
    // Recheck the entire batch under the same inventory locks used by native reservations.
    for (const item of run.plan) {
      if (await singleManagedItem(db, item.variantId) !== item.inventoryItemId) throw new ImportRejected('INVENTORY_AMBIGUOUS', item.row)
      const level = await levelFor(container, item)
      if ((level?.id ?? null) !== item.levelId || (level ? Number(level.stocked_quantity) : null) !== item.previousStock) {
        throw new ImportRejected('STOCK_DRIFT', item.row)
      }
      if (level && item.quantity < Number(level.reserved_quantity)) throw new ImportRejected('RESERVATION_CONFLICT', item.row)
      const links = await db('product_product_variant_supplier_supplier_mapping as l')
        .join('supplier_mapping as m','m.id','l.supplier_mapping_id').where({'l.product_variant_id':item.variantId})
        .whereNull('l.deleted_at').select('m.id','m.deleted_at')
      if (item.mappingId ? links.length !== 1 || links[0].id !== item.mappingId || links[0].deleted_at : links.length !== 0) {
        throw new ImportRejected('MAPPING_CONFLICT', item.row)
      }
    }
    for (const item of run.plan) {
      ensureLock(signal)
      if (!item.mappingId) {
        item.mappingStage = 'pending'
        await savePlan(container, run)
        const {result} = await createSupplierMappingWorkflow(container).run({input:{
          supplierId:run.supplier_id, externalSku:item.externalSku, variantId:item.variantId,
        }})
        item.mappingId = result.id
        item.mappingStage = 'created'
        run.targets.push(result.id)
        await savePlan(container, run)
      }
      if (item.previousStock === null || item.previousStock !== item.quantity) {
        ensureLock(signal)
        item.stockStage = 'pending'
        await savePlan(container, run)
        const input = {inventory_item_id:item.inventoryItemId, location_id:item.locationId, stocked_quantity:item.quantity}
        if (item.levelId) {
          await updateInventoryLevelsWorkflow(container).run({input:{updates:[{...input, id:item.levelId}]}})
        } else {
          const {result} = await createInventoryLevelsWorkflow(container).run({input:{inventory_levels:[input]}})
          item.levelId = result[0].id
        }
        item.stockStage = 'written'
        await savePlan(container, run)
      }
    }
    ensureLock(signal)
  })
  // Publish only after the lock provider confirms the whole locked job completed.
  await db.transaction(async trx => {
    if (run.plan.length) await trx('supplier_observation').insert(run.plan.map(item => ({
      id:generateEntityId(undefined, 'sobs'), mapping_id:item.mappingId, run_id:run.id,
      quantity:item.quantity, observed_at:item.observedAt,
    })))
    const changed = await trx('supplier_import_run').where({id:run.id, status:'running'}).update({
      status:'succeeded', applied_count:run.plan.length, completed_at:trx.fn.now(), updated_at:trx.fn.now(),
    })
    if (changed !== 1) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Import state unavailable')
  })
}

// Call only after the original worker has stopped or from its workflow compensation.
export async function compensateImport(container:MedusaContainer, runId:string) {
  const db = database(container)
  const run = await getImportRun(db, runId)
  if (!run || !['running','reconciliation'].includes(run.status)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Import unavailable')
  await updateImport(db, run.id, {status:'reconciliation'})
  try {
    await withInventoryLocks(container, run.plan, async signal => {
      for (const item of [...run.plan].reverse()) {
        ensureLock(signal)
        const level = await levelFor(container, item)
        if (item.stockStage === 'pending') {
          if ((level?.id ?? null) !== item.levelId || (level ? Number(level.stocked_quantity) : null) !== item.previousStock) {
            throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Stock ownership uncertain')
          }
          item.stockStage = 'restored'
          await savePlan(container, run)
        }
        if (item.stockStage === 'written') {
          if (!level || level.id !== item.levelId || Number(level.stocked_quantity) !== item.quantity ||
              Number(level.reserved_quantity) > (item.previousStock ?? 0)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Stock changed after import')
          if (item.previousStock === null) {
            if (Number(level.reserved_quantity) || Number(level.incoming_quantity)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Stock in use')
            await deleteInventoryLevelsWorkflow(container).run({input:{id:[level.id], force:true}})
          } else {
            await updateInventoryLevelsWorkflow(container).run({input:{updates:[{
              id:level.id, inventory_item_id:item.inventoryItemId, location_id:item.locationId, stocked_quantity:item.previousStock,
            }]}})
          }
          item.stockStage = 'restored'
          await savePlan(container, run)
        }
        if (item.mappingStage === 'pending') {
          const mapping = await db('supplier_mapping').where({supplier_id:run.supplier_id, external_sku:item.externalSku}).first()
          if (mapping) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Mapping ownership uncertain')
          item.mappingStage = 'removed'
          await savePlan(container, run)
        }
        if (item.mappingStage === 'created') {
          const links = await db('product_product_variant_supplier_supplier_mapping').where({supplier_mapping_id:item.mappingId})
            .whereNull('deleted_at').select('product_variant_id')
          if (links.length !== 1 || links[0].product_variant_id !== item.variantId) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Mapping changed after import')
          await container.resolve(ContainerRegistrationKeys.LINK).dismiss(mappingLink(item))
          await container.resolve<SupplierModuleService>(SUPPLIER_MODULE).deleteSupplierMappings(item.mappingId!)
          item.mappingStage = 'removed'
          await savePlan(container, run)
        }
      }
    })
    const hadWrites = run.plan.some(item => item.stockStage === 'restored' || item.mappingStage === 'removed')
    await updateImport(db, run.id, {status:hadWrites ? 'failed' : 'rejected', completed_at:db.fn.now()})
  } catch {
    await updateImport(db, run.id, {status:'reconciliation', error_code:'RECONCILIATION_REQUIRED'})
  }
}
