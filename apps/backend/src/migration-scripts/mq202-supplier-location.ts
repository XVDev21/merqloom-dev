import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import { createStockLocationsWorkflow } from '@medusajs/medusa/core-flows'
import { SUPPLIER_MODULE } from '../modules/supplier'
import SupplierModuleService from '../modules/supplier/service'

export default async function supplierLocation({container}: {container:MedusaContainer}) {
  const service = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const suppliers = await service.listSuppliers({code:'fictional-north'})
  if (suppliers.length > 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Supplier fixture is ambiguous.')
  if (!suppliers.length) await service.createSuppliers({code:'fictional-north', name:'Fictional North'})
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {data:locations} = await query.graph({entity:'stock_location', fields:['id','name','metadata'], filters:{name:'Fictional North supplier stock'}})
  if (locations.length > 1 || (locations[0] && locations[0].metadata?.supplier_code !== 'fictional-north')) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Supplier stock location is ambiguous.')
  }
  if (!locations.length) await createStockLocationsWorkflow(container).run({input:{locations:[{
    name:'Fictional North supplier stock', metadata:{supplier_code:'fictional-north', synthetic:true},
  }]}})
}
