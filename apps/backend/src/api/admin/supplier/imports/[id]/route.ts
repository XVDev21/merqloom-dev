import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { database, getImportRun, publicImportRun } from '../../../../../modules/supplier/import-audit'

export async function GET(req:MedusaRequest, res:MedusaResponse) {
  const id = req.params.id
  const run = /^[A-Za-z0-9_]{1,128}$/.test(id) ? await getImportRun(database(req.scope), id) : undefined
  if (!run) { res.status(404).json({error:{code:'IMPORT_NOT_FOUND'}}); return }
  res.status(200).json({run:publicImportRun(run)})
}
