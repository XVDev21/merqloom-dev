import { MedusaService } from '@medusajs/framework/utils'
import Supplier from './models/supplier'
import SupplierMapping from './models/supplier-mapping'

export default class SupplierModuleService extends MedusaService({ Supplier, SupplierMapping }) {}
