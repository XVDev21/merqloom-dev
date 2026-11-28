import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { asValue } from '@medusajs/framework/awilix'
import { Client } from '@medusajs/framework/pg'
import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'
import { SUPPLIER_MODULE } from '../modules/supplier'
import SupplierModuleService from '../modules/supplier/service'
import { createSupplierMappingWorkflow } from '../workflows/create-supplier-mapping'

export default async function supplierFixture({ container }: { container: MedusaContainer }) {
  const suffix = randomBytes(6).toString('hex')
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  const suppliers = await supplier.createSuppliers([
    { code:`mq201-north-${suffix}`, name:'Fictional North' },
    { code:`mq201-south-${suffix}`, name:'Fictional South' },
  ])
  const [north, south] = suppliers
  const mappingIds: string[] = []
  const linkFor = (variantId: string, mappingId: string) => ({
    [Modules.PRODUCT]: { product_variant_id: variantId },
    [SUPPLIER_MODULE]: { supplier_mapping_id: mappingId },
  })
  try {
    assert.ok(north.id && south.id && north.id !== south.id)
    assert.equal(north.name, 'Fictional North')
    await assert.rejects(supplier.createSuppliers({ code:north.code, name:'Duplicate supplier' }))
    const { data: variants } = await query.graph({ entity:'product_variant', fields:['id','sku'],
      filters:{ sku:['MQ-SUPPLIER-POUCH','MQ-DIRECT-TRAY'] } })
    const pouch = variants.find(item => item.sku === 'MQ-SUPPLIER-POUCH')
    const direct = variants.find(item => item.sku === 'MQ-DIRECT-TRAY')
    assert.ok(pouch && direct)
    const create = (supplierId: string, externalSku: string, variantId = pouch.id) =>
      createSupplierMappingWorkflow(container).run({ input:{ supplierId, externalSku, variantId } })
    const first = (await create(north.id, '  POUCH-NATURAL  ')).result
    mappingIds.push(first.id)
    assert.equal(first.external_sku, 'POUCH-NATURAL')
    const second = (await create(south.id, 'POUCH-NATURAL')).result
    mappingIds.push(second.id)
    const lower = (await create(north.id, 'pouch-natural')).result
    mappingIds.push(lower.id)
    assert.equal(lower.external_sku, 'pouch-natural')
    for (const id of mappingIds) assert.equal((await link.list(linkFor(pouch.id, id))).length, 1)
    await assert.rejects(link.create(linkFor(direct.id, first.id)), 'a mapping cannot link to two variants')
    await assert.rejects(create(north.id, 'POUCH-NATURAL'), 'same supplier and SKU must be unique')

    const beforeInvalid = (await supplier.listSupplierMappings({ supplier_id:north.id })).length
    for (const input of [
      { supplierId:north.id, externalSku:'   ', variantId:pouch.id },
      { supplierId:'sup_missing', externalSku:'MISSING-SUPPLIER', variantId:pouch.id },
      { supplierId:north.id, externalSku:'MISSING-VARIANT', variantId:'variant_missing' },
      { supplierId:north.id, externalSku:'DIRECT-VARIANT', variantId:direct.id },
    ]) await assert.rejects(createSupplierMappingWorkflow(container).run({input}))
    assert.equal((await supplier.listSupplierMappings({ supplier_id:north.id })).length, beforeInvalid)

    await assert.rejects(db.query('insert into supplier_mapping (id,supplier_id,external_sku) values ($1,$2,$3)',
      [`smap_duplicate_${suffix}`,north.id,'POUCH-NATURAL']), (error: { code?: string }) => error.code === '23505')
    await db.query('insert into supplier_mapping (id,supplier_id,external_sku,deleted_at) values ($1,$2,$3,now())',
      [`smap_deleted_${suffix}`,north.id,'DELETED-SKU'])
    try {
      await assert.rejects(db.query('insert into supplier_mapping (id,supplier_id,external_sku) values ($1,$2,$3)',
        [`smap_deleted_duplicate_${suffix}`,north.id,'DELETED-SKU']), (error: { code?: string }) => error.code === '23505')
    } finally { await db.query('delete from supplier_mapping where id=$1', [`smap_deleted_${suffix}`]) }

    const writerA = new Client({ connectionString:process.env.DATABASE_URL })
    const writerB = new Client({ connectionString:process.env.DATABASE_URL })
    await Promise.all([writerA.connect(), writerB.connect()])
    try {
      await writerA.query('begin')
      await writerB.query('begin')
      const pid = (await writerB.query('select pg_backend_pid() as pid')).rows[0].pid
      await writerA.query('insert into supplier_mapping (id,supplier_id,external_sku) values ($1,$2,$3)', [`smap_race_a_${suffix}`,north.id,'RACE-SKU'])
      const overlapping = writerB.query('insert into supplier_mapping (id,supplier_id,external_sku) values ($1,$2,$3)', [`smap_race_b_${suffix}`,north.id,'RACE-SKU'])
        .then(() => 'unexpected-success', (error: { code?: string }) => error.code)
      let waiting = false
      for (let attempt = 0; attempt < 80 && !waiting; attempt++) {
        const state = await db.query('select wait_event_type from pg_stat_activity where pid=$1', [pid])
        waiting = state.rows[0]?.wait_event_type === 'Lock'
        if (!waiting) await new Promise(resolve => setTimeout(resolve, 25))
      }
      assert.ok(waiting, 'second write overlaps the uncommitted unique key')
      await writerA.query('commit')
      assert.equal(await overlapping, '23505')
      await writerB.query('rollback')
    } finally {
      await writerA.query('rollback').catch(() => {})
      await writerB.query('rollback').catch(() => {})
      await Promise.all([writerA.end(), writerB.end()])
      await db.query('delete from supplier_mapping where id=$1', [`smap_race_a_${suffix}`])
    }

    const scope = container.createScope()
    let failedLink: ReturnType<typeof linkFor> | undefined
    scope.register({ [ContainerRegistrationKeys.LINK]:asValue({
      create:async (data: ReturnType<typeof linkFor>[]) => {
        failedLink = data[0]
        await link.create(data)
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Controlled link failure after write')
      },
      dismiss:link.dismiss.bind(link),
    }) })
    await assert.rejects(createSupplierMappingWorkflow(scope).run({ input:{ supplierId:north.id, externalSku:'FAIL-LINK', variantId:pouch.id } }))
    assert.ok(failedLink, 'the controlled failure reached link creation')
    assert.equal((await supplier.listSupplierMappings({ supplier_id:north.id, external_sku:'FAIL-LINK' })).length, 0)
    assert.equal((await link.list(failedLink)).length, 0, 'failed link leaves no association')

    await link.dismiss(linkFor(pouch.id, first.id))
    await supplier.deleteSupplierMappings(first.id)
    await supplier.deleteSupplierMappings(second.id)
    const { data: survivingVariant } = await query.graph({ entity:'product_variant', fields:['id'], filters:{ id:pouch.id } })
    assert.equal(survivingVariant.length, 1, 'dismissing or deleting a mapping does not delete the native variant')
    console.log('MQ201_SUPPLIER_FIXTURE_PASSED')
  } finally {
    const { data: [pouch] } = await query.graph({ entity:'product_variant', fields:['id'], filters:{ sku:'MQ-SUPPLIER-POUCH' } })
    if (pouch) for (const id of mappingIds) await link.dismiss(linkFor(pouch.id,id)).catch(() => {})
    if (mappingIds.length) await supplier.deleteSupplierMappings(mappingIds).catch(() => {})
    await supplier.deleteSuppliers(suppliers.map(item => item.id)).catch(() => {})
    await db.end()
  }
}
