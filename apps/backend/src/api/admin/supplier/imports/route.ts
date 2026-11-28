import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { startSupplierImport } from '../../../../workflows/import-supplier-csv'

export async function POST(req:MedusaRequest, res:MedusaResponse) {
  const {httpStatus, ...body} = await startSupplierImport(req.scope, req.body)
  res.status(httpStatus).json(body)
}
