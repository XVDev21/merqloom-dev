import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { z } from '@medusajs/framework/zod'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'
import { SUPPLIER_MODULE } from '../modules/supplier'
import SupplierModuleService from '../modules/supplier/service'

type MappingInput = { supplierId: string; externalSku: string; variantId: string }
const inputSchema = z.object({
  supplierId:z.string().trim().min(1).max(128),
  externalSku:z.string().trim().min(1).max(128),
  variantId:z.string().trim().min(1).max(128),
})
const mappingLink = (variantId: string, mappingId: string) => ({
  [Modules.PRODUCT]: { product_variant_id:variantId },
  [SUPPLIER_MODULE]: { supplier_mapping_id:mappingId },
})

const createSupplierMappingStep = createStep('create-supplier-mapping', async (input: MappingInput, { container }) => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid supplier mapping input.')
  const { supplierId, externalSku, variantId } = parsed.data
  const service = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  await service.retrieveSupplier(supplierId)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [variant] } = await query.graph({ entity:'product_variant', fields:['id','product.metadata'], filters:{ id:variantId } })
  if (!variant || variant.product?.metadata?.source !== 'supplier') {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Mapping requires a supplier product variant.')
  }
  const mapping = await service.createSupplierMappings({ supplier_id:supplierId, external_sku:externalSku })
  return new StepResponse({ mapping, variantId }, { mappingId:mapping.id, variantId })
}, async (created, { container }) => {
  if (!created) return
  await container.resolve(ContainerRegistrationKeys.LINK).dismiss(mappingLink(created.variantId, created.mappingId))
  await container.resolve<SupplierModuleService>(SUPPLIER_MODULE).deleteSupplierMappings(created.mappingId)
})

export const createSupplierMappingWorkflow = createWorkflow('create-supplier-mapping', (input: MappingInput) => {
  const created = createSupplierMappingStep(input)
  const links = transform({ created }, ({ created }) => [mappingLink(created.variantId, created.mapping.id)])
  createRemoteLinkStep(links)
  return new WorkflowResponse(created.mapping)
})
