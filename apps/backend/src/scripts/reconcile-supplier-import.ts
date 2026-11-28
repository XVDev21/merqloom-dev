import type { MedusaContainer } from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'
import { database, getImportRun, publicImportRun } from '../modules/supplier/import-audit'
import { compensateImport } from '../modules/supplier/import-execution'

// Stop all import workers before using this operator-only command.
export default async function reconcileSupplierImport({container}:{container:MedusaContainer}) {
  const runId = process.env.MQ202_RUN_ID ?? ''
  if (!/^sirun_[A-Za-z0-9]+$/.test(runId)) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid import run ID.')
  await compensateImport(container, runId)
  const run = await getImportRun(database(container), runId)
  if (!run) throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Import unavailable.')
  console.log(JSON.stringify(publicImportRun(run)))
}
