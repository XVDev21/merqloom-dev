import { createHash } from 'node:crypto'
import type { MedusaContainer } from '@medusajs/framework'
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { z } from '@medusajs/framework/zod'
import { parseSupplierCsv } from '../modules/supplier/csv-import'
import { claimImport, database, getImportRun, publicImportRun, updateImport, type PublicImportRun } from '../modules/supplier/import-audit'
import { applyImport, compensateImport, ImportLockLost } from '../modules/supplier/import-execution'
import { existingTargets, ImportRejected, preflightImport, supplierLocation } from '../modules/supplier/import-plan'

const envelope = z.object({
  supplierId:z.string().trim().min(1).max(128),
  idempotencyKey:z.string().trim().min(1).max(128),
  csv:z.string().max(512 * 1024),
}).strict()

type ImportResponse = {httpStatus:number; run?:PublicImportRun; error?:{code:string}}
const responseFor = async (container:MedusaContainer, runId:string, httpStatus:number):Promise<ImportResponse> => {
  const run = await getImportRun(database(container), runId)
  return run ? {httpStatus, run:publicImportRun(run)} : {httpStatus:500, error:{code:'IMPORT_UNAVAILABLE'}}
}

const applySupplierImportStep = createStep('apply-supplier-import', async ({runId}:{runId:string}, {container}) => {
  try {
    await applyImport(container, runId)
    return new StepResponse({runId}, {runId})
  } catch (error) {
    const code = error instanceof ImportRejected ? error.importCode : 'IMPORT_FAILED'
    const row = error instanceof ImportRejected ? error.row : undefined
    const lockLost = error instanceof ImportLockLost
    await updateImport(database(container), runId, {error_code:lockLost ? 'RECONCILIATION_REQUIRED' : code,
      error_row:row ?? null, ...(lockLost && {status:'reconciliation'})})
    return StepResponse.permanentFailure('Supplier import failed.', {runId, lockLost})
  }
}, async (input:{runId:string; lockLost?:boolean} | undefined, {container}) => {
  if (input && !input.lockLost) await compensateImport(container, input.runId)
})

const applySupplierImportWorkflow = createWorkflow('apply-supplier-import', (input:{runId:string}) => {
  return new WorkflowResponse(applySupplierImportStep(input))
})

// The CSV remains outside workflow state and audit storage; only its digest is retained.
export async function startSupplierImport(container:MedusaContainer, input:unknown):Promise<ImportResponse> {
  const parsed = envelope.safeParse(input)
  if (!parsed.success) return {httpStatus:400, error:{code:'INVALID_ENVELOPE'}}
  const {supplierId, idempotencyKey, csv} = parsed.data
  const db = database(container)
  const supplier = await db('supplier').where({id:supplierId, code:'fictional-north'}).whereNull('deleted_at').first('id')
  if (!supplier) return {httpStatus:400, error:{code:'SUPPLIER_UNAVAILABLE'}}
  const digest = createHash('sha256').update(csv, 'utf8').digest('hex')
  const claim = await claimImport(db, supplierId, idempotencyKey, digest)
  if (claim.kind === 'busy') return {httpStatus:409, error:{code:'IMPORT_IN_PROGRESS'}}
  if (claim.kind === 'conflict') return {httpStatus:409, error:{code:'IDEMPOTENCY_CONFLICT'}}
  if (claim.kind === 'replay') return {httpStatus:200, run:publicImportRun(claim.run)}
  const runId = claim.run.id
  const file = parseSupplierCsv(csv, new Date())
  if (!file.ok) {
    await updateImport(db, runId, {status:'rejected', error_code:file.code, error_row:file.row ?? null, completed_at:db.fn.now()})
    return responseFor(container, runId, 422)
  }
  try {
    const targets = await existingTargets(db, supplierId, file.rows)
    await updateImport(db, runId, {targets, row_count:file.rows.length})
    const locationId = await supplierLocation(container, supplierId)
    const plan = await preflightImport(container, supplierId, locationId, file.rows)
    await updateImport(db, runId, {plan})
  } catch (error) {
    const expected = error instanceof ImportRejected
    await updateImport(db, runId, {status:expected ? 'rejected' : 'failed',
      error_code:expected ? error.importCode : 'IMPORT_FAILED', error_row:expected ? error.row ?? null : null, completed_at:db.fn.now()})
    return responseFor(container, runId, expected ? 422 : 500)
  }
  try {
    await applySupplierImportWorkflow(container).run({input:{runId}})
  } catch {
    // A lost worker or failed compensation retains the supplier's active claim.
    const run = await getImportRun(db, runId)
    if (run?.status === 'running') await updateImport(db, runId, {status:'reconciliation', error_code:'RECONCILIATION_REQUIRED'})
  }
  const run = await getImportRun(db, runId)
  return responseFor(container, runId, run?.status === 'succeeded' ? 200 : run?.status === 'rejected' ? 422 : 500)
}
