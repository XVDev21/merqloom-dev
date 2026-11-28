import { model } from '@medusajs/framework/utils'
import SupplierMapping from './supplier-mapping'
import SupplierImportRun from './supplier-import-run'

const SupplierObservation = model.define('supplier_observation', {
  id:model.id({prefix:'sobs'}).primaryKey(),
  mapping:model.belongsTo(() => SupplierMapping, {mappedBy:'observations'}),
  run:model.belongsTo(() => SupplierImportRun, {mappedBy:'observations'}),
  quantity:model.number(),
  observed_at:model.text(),
}).indexes([{name:'IDX_supplier_observation_run_mapping', on:['run_id','mapping_id'], unique:true, where:null}])

export default SupplierObservation
