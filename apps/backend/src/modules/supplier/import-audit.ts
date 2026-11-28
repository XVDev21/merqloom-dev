import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, createPgConnection, generateEntityId, MedusaError } from '@medusajs/framework/utils'
import type { RefreshStatus } from './freshness'

export type Database = ReturnType<typeof createPgConnection>
export type ImportPlanItem = {
  row:number; externalSku:string; variantId:string; inventoryItemId:string; locationId:string; quantity:number; observedAt:string
  sameObservation:boolean
  mappingId:string | null; mappingStage:'existing' | 'none' | 'pending' | 'created' | 'removed'
  levelId:string | null; previousStock:number | null; stockStage:'none' | 'pending' | 'written' | 'restored'
}
export type ImportRun = {
  id:string; supplier_id:string; idempotency_key:string; payload_hash:string; status:RefreshStatus
  row_count:number; applied_count:number; error_code:string | null; error_row:number | null
  targets:string[]; plan:ImportPlanItem[]; created_at:Date; completed_at:Date | null
}
export type PublicImportRun = {
  id:string; status:RefreshStatus; rowCount:number; appliedCount:number; startedAt:string; completedAt:string | null
  error?:{code:string; row?:number}
}

export const database = (container: MedusaContainer) => container.resolve<Database>(ContainerRegistrationKeys.PG_CONNECTION)
export const getImportRun = (db:Database, id:string):Promise<ImportRun | undefined> =>
  db<ImportRun>('supplier_import_run').where({id}).whereNull('deleted_at').first()
export function publicImportRun(run:ImportRun):PublicImportRun {
  return { id:run.id, status:run.status, rowCount:run.row_count, appliedCount:run.applied_count,
    startedAt:new Date(run.created_at).toISOString(), completedAt:run.completed_at ? new Date(run.completed_at).toISOString() : null,
    ...(run.error_code && {error:{code:run.error_code, ...(run.error_row && {row:run.error_row})}}) }
}

export async function claimImport(db:Database, supplierId:string, idempotencyKey:string, payloadHash:string) {
  try {
    const [run] = await db<ImportRun>('supplier_import_run').insert({
      id:generateEntityId(undefined, 'sirun'), supplier_id:supplierId, idempotency_key:idempotencyKey,
      payload_hash:payloadHash, status:'running',
    }).returning('*')
    return {kind:'created' as const, run}
  } catch (error) {
    if ((error as {code?:string}).code !== '23505') throw error
    const run = await db<ImportRun>('supplier_import_run').where({supplier_id:supplierId, idempotency_key:idempotencyKey}).first()
    if (!run) return {kind:'busy' as const}
    return run.payload_hash === payloadHash ? {kind:'replay' as const, run} : {kind:'conflict' as const}
  }
}

export async function updateImport(db:Database, id:string, values:Record<string, unknown>) {
  const encoded = {...values}
  for (const key of ['targets', 'plan']) if (Array.isArray(encoded[key])) encoded[key] = JSON.stringify(encoded[key])
  const changed = await db('supplier_import_run').where({id}).whereIn('status',['running','reconciliation'])
    .update({...encoded, updated_at:db.fn.now()})
  if (changed !== 1) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Import state unavailable')
}
