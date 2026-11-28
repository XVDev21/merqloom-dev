import { model } from '@medusajs/framework/utils'
import SupplierMapping from './supplier-mapping'
import SupplierImportRun from './supplier-import-run'

const Supplier = model.define('supplier', {
  id: model.id({ prefix:'sup' }).primaryKey(),
  code: model.text().unique(),
  name: model.text(),
  mappings: model.hasMany(() => SupplierMapping, { mappedBy:'supplier' }),
  import_runs: model.hasMany(() => SupplierImportRun, { mappedBy:'supplier' }),
})

export default Supplier
