import { model } from '@medusajs/framework/utils'
import Supplier from './supplier'
import SupplierObservation from './supplier-observation'

const SupplierImportRun = model.define('supplier_import_run', {
  id:model.id({prefix:'sirun'}).primaryKey(),
  supplier:model.belongsTo(() => Supplier, {mappedBy:'import_runs'}),
  idempotency_key:model.text(),
  payload_hash:model.text(),
  status:model.enum(['running','succeeded','rejected','failed','reconciliation']).default('running'),
  row_count:model.number().default(0),
  applied_count:model.number().default(0),
  error_code:model.text().nullable(),
  error_row:model.number().nullable(),
  targets:model.json<string[]>().default([]),
  plan:model.json<unknown[]>().default([]),
  completed_at:model.dateTime().nullable(),
  observations:model.hasMany(() => SupplierObservation, {mappedBy:'run'}),
}).indexes([
  {name:'IDX_supplier_import_run_key', on:['supplier_id','idempotency_key'], unique:true, where:null},
  {name:'IDX_supplier_import_run_active', on:['supplier_id'], unique:true,
    where:"status IN ('running', 'reconciliation') AND deleted_at IS NULL"},
])

export default SupplierImportRun
