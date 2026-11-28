import { MedusaService } from '@medusajs/framework/utils'
import Supplier from './models/supplier'
import SupplierMapping from './models/supplier-mapping'
import SupplierImportRun from './models/supplier-import-run'
import SupplierObservation from './models/supplier-observation'

export default class SupplierModuleService extends MedusaService({ Supplier, SupplierMapping, SupplierImportRun, SupplierObservation }) {}
