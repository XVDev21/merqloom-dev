import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { asValue } from '@medusajs/framework/awilix'
import { Client } from '@medusajs/framework/pg'
import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'
import { createReservationsWorkflow, deleteReservationsWorkflow, updateStockLocationsWorkflow } from '@medusajs/medusa/core-flows'
import { SUPPLIER_MODULE } from '../modules/supplier'
import SupplierModuleService from '../modules/supplier/service'
import { getSupplierEligibility } from '../modules/supplier/eligibility'
import { claimImport, database, updateImport } from '../modules/supplier/import-audit'
import { compensateImport } from '../modules/supplier/import-execution'
import { createSupplierMappingWorkflow } from '../workflows/create-supplier-mapping'
import { startSupplierImport } from '../workflows/import-supplier-csv'

export default async function supplierImportFixture({container}: {container:MedusaContainer}) {
  const suffix = randomBytes(6).toString('hex')
  const supplierService = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventory = container.resolve(Modules.INVENTORY)
  const db = new Client({connectionString:process.env.DATABASE_URL})
  await db.connect()
  try {
    const [supplier] = await supplierService.listSuppliers({code:'fictional-north'})
    assert.ok(supplier)
    const {data:[location]} = await query.graph({entity:'stock_location', fields:['id','name','metadata'], filters:{name:'Fictional North supplier stock'}})
    assert.ok(location && location.metadata?.supplier_code === 'fictional-north')
    const {data:[variant]} = await query.graph({entity:'product_variant', fields:['id','sku'], filters:{sku:'MQ-SUPPLIER-POUCH'}})
    assert.ok(variant)
    const nativeItems = await db.query('select inventory_item_id from product_variant_inventory_item where variant_id=$1 and deleted_at is null', [variant.id])
    assert.equal(nativeItems.rows.length, 1)
    const itemId = nativeItems.rows[0].inventory_item_id as string
    const channels = await db.query('select count(*)::int as n from sales_channel_stock_location where stock_location_id=$1 and deleted_at is null', [location.id])
    assert.equal(channels.rows[0].n, 0)
    const header = 'external_sku,variant_sku,quantity,observed_at'
    const observedAt = new Date(Date.now() - 200).toISOString()
    const csv = `${header}\nPOUCH-NATURAL,MQ-SUPPLIER-POUCH,6,${observedAt}\n`
    const run = (idempotencyKey:string, data = csv) => startSupplierImport(container,{supplierId:supplier.id,idempotencyKey,csv:data})
    const withObservationFailure = async (execute:() => ReturnType<typeof run>) => {
      await db.query(`create or replace function mq202_fail_observation() returns trigger language plpgsql as $$
        begin raise exception 'synthetic observation failure'; end $$`)
      await db.query('create trigger mq202_fail_observation before insert on supplier_observation for each row execute function mq202_fail_observation()')
      try { return await execute() }
      finally {
        await db.query('drop trigger if exists mq202_fail_observation on supplier_observation')
        await db.query('drop function if exists mq202_fail_observation()')
      }
    }
    const [existingMapping] = await supplierService.listSupplierMappings({supplier_id:supplier.id, external_sku:'POUCH-NATURAL'})
    if (!existingMapping) {
      const assertNoSupplierWrites = async () => {
        assert.equal((await supplierService.listSupplierMappings({supplier_id:supplier.id})).length, 0)
        assert.equal((await inventory.listInventoryLevels({inventory_item_id:itemId, location_id:location.id})).length, 0)
        const {rows:[counts]} = await db.query(
          'select (select count(*)::int from product_product_variant_supplier_supplier_mapping where product_variant_id=$1 and deleted_at is null) as links, (select count(*)::int from supplier_observation) as observations',
          [variant.id],
        )
        assert.deepEqual(counts, {links:0, observations:0})
      }
      const wrongSku = await run(`wrong-sku-${suffix}`, csv.replace('POUCH-NATURAL', 'POUCH-NOT-IN-ADAPTER'))
      assert.equal(wrongSku.httpStatus, 422, 'an unsupported supplier SKU is rejected on fresh data')
      assert.equal(wrongSku.run?.error?.code, 'SUPPLIER_SKU_UNAVAILABLE')
      await assertNoSupplierWrites()
      const rolledBack = await withObservationFailure(() => run(`new-mapping-failure-${suffix}`))
      assert.equal(rolledBack.run?.status, 'failed')
      await assertNoSupplierWrites()
    }
    const first = await run(`first-${suffix}`)
    assert.equal(first.httpStatus, 200)
    assert.equal(first.run?.status, 'succeeded')
    const [mapping] = await supplierService.listSupplierMappings({supplier_id:supplier.id, external_sku:'POUCH-NATURAL'})
    assert.ok(mapping)
    const [level] = await inventory.listInventoryLevels({inventory_item_id:itemId, location_id:location.id})
    assert.ok(level)
    assert.equal(Number(level.stocked_quantity), 6)
    const beforeReplay = String(level.updated_at)
    const replay = await run(`first-${suffix}`)
    assert.equal(replay.run?.id, first.run?.id)
    assert.equal((await supplierService.listSupplierMappings({supplier_id:supplier.id, external_sku:'POUCH-NATURAL'}))[0].id, mapping.id)
    assert.equal(String((await inventory.listInventoryLevels({id:level.id}))[0].updated_at), beforeReplay)
    await updateStockLocationsWorkflow(container).run({input:{selector:{id:location.id}, update:{name:'Temporarily unavailable'}}})
    try {
      const replayWithoutLocation = await run(`first-${suffix}`)
      assert.equal(replayWithoutLocation.run?.id, first.run?.id, 'replay returns its outcome even when the location is unavailable')
      const unavailable = await run(`location-unavailable-${suffix}`)
      assert.equal(unavailable.run?.error?.code, 'LOCATION_UNAVAILABLE')
    } finally {
      await updateStockLocationsWorkflow(container).run({input:{selector:{id:location.id}, update:{name:'Fictional North supplier stock'}}})
    }
    assert.equal((await run(`first-${suffix}`, csv + '\n')).httpStatus, 409)
    const sameObservation = await run(`equal-${suffix}`)
    assert.equal(sameObservation.run?.status, 'succeeded')
    assert.equal(String((await inventory.listInventoryLevels({id:level.id}))[0].updated_at), beforeReplay)
    const eligible = () => getSupplierEligibility(container,{supplierId:supplier.id,mappingId:mapping.id,now:new Date()})
    assert.equal((await eligible()).reason, 'FRESH')
    await db.query('update inventory_item set deleted_at=now() where id=$1', [itemId])
    try {
      const missingItem = await run(`missing-item-${suffix}`, csv)
      assert.equal(missingItem.run?.error?.code, 'INVENTORY_AMBIGUOUS', 'a deleted inventory item is rejected before writes')
      assert.equal((await eligible()).reason, 'MAPPING_UNAVAILABLE')
    } finally { await db.query('update inventory_item set deleted_at=null where id=$1', [itemId]) }
    assert.equal((await run(`after-item-${suffix}`, csv)).run?.status, 'succeeded')
    const competitor = await supplierService.createSuppliers({code:`competitor-${suffix}`,name:'Fictional competitor'})
    const competingMapping = (await createSupplierMappingWorkflow(container).run({input:{
      supplierId:competitor.id, externalSku:`OTHER-${suffix}`, variantId:variant.id,
    }})).result
    try {
      assert.equal((await eligible()).reason, 'MAPPING_UNAVAILABLE', 'competing links make eligibility fail closed')
      const conflicting = await run(`competing-${suffix}`, csv)
      assert.equal(conflicting.run?.error?.code, 'MAPPING_CONFLICT')
    } finally {
      await container.resolve(ContainerRegistrationKeys.LINK).dismiss({
        [Modules.PRODUCT]:{product_variant_id:variant.id}, [SUPPLIER_MODULE]:{supplier_mapping_id:competingMapping.id},
      })
      await supplierService.deleteSupplierMappings(competingMapping.id)
      await supplierService.deleteSuppliers(competitor.id)
    }
    const restored = await run(`after-competitor-${suffix}`, csv)
    assert.equal(restored.run?.status, 'succeeded')
    const direct = await run(`direct-${suffix}`, `${header}\nDIRECT,MQ-DIRECT-TRAY,5,${observedAt}\n`)
    assert.equal(direct.run?.error?.code, 'VARIANT_UNAVAILABLE')
    const omitted = await run(`omitted-${suffix}`, `${header}\n`)
    assert.equal(omitted.run?.status, 'succeeded')
    assert.equal((await eligible()).reason, 'FRESH', 'omitted mappings keep their observation')
    const malformed = await run(`malformed-${suffix}`, `${header}\n"bad`)
    assert.equal(malformed.run?.status, 'rejected')
    assert.equal((await eligible()).reason, 'FRESH', 'malformed input does not invalidate unrelated mappings')
    const older = new Date(Date.parse(observedAt) - 1).toISOString()
    const stale = await run(`older-${suffix}`, `${header}\nPOUCH-NATURAL,MQ-SUPPLIER-POUCH,7,${older}\n`)
    assert.equal(stale.run?.status, 'rejected')
    assert.equal((await eligible()).reason, 'REFRESH_FAILED')
    assert.equal(Number((await inventory.listInventoryLevels({id:level.id}))[0].stocked_quantity), 6)
    const timestampConflict = await run(`timestamp-conflict-${suffix}`, `${header}\nPOUCH-NATURAL,MQ-SUPPLIER-POUCH,7,${observedAt}\n`)
    assert.equal(timestampConflict.run?.error?.code, 'TIMESTAMP_CONFLICT')
    await db.query('update supplier_mapping set deleted_at=now() where id=$1', [mapping.id])
    try {
      const deleted = await run(`deleted-${suffix}`, csv)
      assert.equal(deleted.run?.error?.code, 'MAPPING_RECONCILIATION')
    } finally { await db.query('update supplier_mapping set deleted_at=null where id=$1', [mapping.id]) }
    const newer = new Date().toISOString()
    const corrected = await run(`corrected-${suffix}`, `${header}\nPOUCH-NATURAL,MQ-SUPPLIER-POUCH,0,${newer}\n`)
    assert.equal(corrected.run?.status, 'succeeded')
    assert.equal((await eligible()).reason, 'OUT_OF_STOCK')
    assert.equal(Number((await inventory.listInventoryLevels({id:level.id}))[0].stocked_quantity), 0)
    const makeCsv = (quantity:number) => `${header}\nPOUCH-NATURAL,MQ-SUPPLIER-POUCH,${quantity},${new Date().toISOString()}\n`
    const failed = await withObservationFailure(() => run(`compensate-${suffix}`, makeCsv(3)))
    assert.equal(failed.run?.status, 'failed', 'a failure after a native stock write is compensated')
    assert.equal(failed.run?.error?.code, 'IMPORT_FAILED')
    assert.doesNotMatch(JSON.stringify(failed), /synthetic observation failure|POUCH-NATURAL/)
    assert.equal(Number((await inventory.listInventoryLevels({id:level.id}))[0].stocked_quantity), 0)
    assert.equal((await eligible()).reason, 'REFRESH_FAILED')
    const recovered = await run(`recovered-${suffix}`, makeCsv(6))
    assert.equal(recovered.run?.status, 'succeeded')
    const {result:[reservation]} = await createReservationsWorkflow(container).run({input:{reservations:[{
      inventory_item_id:itemId, location_id:location.id, quantity:2,
    }]}})
    try {
      const belowReserved = await run(`reserved-${suffix}`, makeCsv(1))
      assert.equal(belowReserved.run?.error?.code, 'RESERVATION_CONFLICT')
      const [reserved] = await inventory.listInventoryLevels({id:level.id})
      assert.equal(Number(reserved.stocked_quantity), 6)
      assert.equal(Number(reserved.reserved_quantity), 2)
    } finally { await deleteReservationsWorkflow(container).run({input:{ids:[reservation.id]}}) }
    const lostLockScope = container.createScope()
    lostLockScope.register({[Modules.LOCKING]:asValue({execute:async (_keys:unknown, job:(signal:AbortSignal) => Promise<unknown>) => {
      const lock = new AbortController()
      lock.abort()
      return job(lock.signal)
    }})})
    const interrupted = await startSupplierImport(lostLockScope, {supplierId:supplier.id,
      idempotencyKey:`lost-lock-${suffix}`, csv:makeCsv(5)})
    assert.equal(interrupted.run?.status, 'reconciliation')
    assert.equal((await eligible()).reason, 'RECONCILIATION')
    assert.equal(Number((await inventory.listInventoryLevels({id:level.id}))[0].stocked_quantity), 6)
    await compensateImport(container, interrupted.run!.id)
    assert.notEqual((await eligible()).reason, 'RECONCILIATION')
    const lateLockScope = container.createScope()
    lateLockScope.register({[Modules.LOCKING]:asValue({execute:async (_keys:unknown, job:(signal:AbortSignal) => Promise<unknown>) => {
      const lock = new AbortController()
      await job(lock.signal)
      lock.abort()
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Controlled lock loss')
    }})})
    const lateLoss = await startSupplierImport(lateLockScope, {supplierId:supplier.id,
      idempotencyKey:`late-lock-loss-${suffix}`, csv:makeCsv(6)})
    assert.equal(lateLoss.run?.status, 'reconciliation', 'a lock lost before release cannot publish success')
    assert.equal((await eligible()).reason, 'RECONCILIATION')
    await compensateImport(container, lateLoss.run!.id)
    const audit = database(container)
    const claims = await Promise.all([
      claimImport(audit, supplier.id, `overlap-a-${suffix}`, 'a'.repeat(64)),
      claimImport(audit, supplier.id, `overlap-b-${suffix}`, 'b'.repeat(64)),
    ])
    assert.deepEqual(claims.map(claim => claim.kind).sort(), ['busy','created'])
    const active = claims.find(claim => claim.kind === 'created')
    assert.ok(active && active.kind === 'created')
    await updateImport(audit, active.run.id, {status:'reconciliation'})
    assert.equal((await eligible()).reason, 'RECONCILIATION')
    assert.equal((await run(`blocked-${suffix}`, makeCsv(6))).error?.code, 'IMPORT_IN_PROGRESS')
    await compensateImport(container, active.run.id)
    assert.notEqual((await eligible()).reason, 'RECONCILIATION')
    console.log('MQ202_IMPORT_FIXTURE_PASSED')
  } finally { await db.end() }
}
