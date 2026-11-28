import { model } from '@medusajs/framework/utils'
import Supplier from './supplier'
import SupplierObservation from './supplier-observation'

const SupplierMapping = model.define('supplier_mapping', {
  id: model.id({ prefix:'smap' }).primaryKey(),
  external_sku: model.text(),
  supplier: model.belongsTo(() => Supplier, { mappedBy:'mappings' }),
  observations: model.hasMany(() => SupplierObservation, { mappedBy:'mapping' }),
}).indexes([{ name:'IDX_supplier_mapping_supplier_sku', on:['supplier_id','external_sku'], unique:true, where:null }])

export default SupplierMapping
