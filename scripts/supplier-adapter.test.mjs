import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

process.env.TS_NODE_PROJECT = new URL('../apps/backend/tsconfig.json', import.meta.url).pathname
const require = createRequire(new URL('../apps/backend/package.json', import.meta.url))
require('ts-node/register/transpile-only')
const adapter = () => require('./src/modules/supplier/adapters/mock.ts').mockSupplierAdapter
const north = 'fictional-north'
const south = 'fictional-south'
const observedAt = '2026-11-28T00:00:00.000Z'

test('catalog fixtures are deterministic and unknown suppliers are rejected', () => {
  const first = adapter().getCatalog(north)
  assert.deepEqual(first, adapter().getCatalog(north))
  assert.deepEqual(first, {ok:true, value:[
    {externalSku:'POUCH-NATURAL', title:'Organizer pouch'},
    {externalSku:'POUCH-ZERO', title:'Unavailable pouch'},
  ]})
  first.value[0].title = 'Modified by caller'
  assert.equal(adapter().getCatalog(north).value[0].title, 'Organizer pouch')
  assert.deepEqual(adapter().getCatalog('unknown'), {ok:false, reason:'UNKNOWN_SUPPLIER'})
})

test('inventory preserves supplied time and distinguishes zero stock from an unknown SKU', () => {
  const input = {supplierCode:north, externalSkus:['POUCH-NATURAL', 'UNKNOWN', 'POUCH-ZERO'], observedAt}
  const result = adapter().getInventory(input)
  assert.deepEqual(result, adapter().getInventory(input))
  assert.deepEqual(result, {ok:true, value:[
    {externalSku:'POUCH-NATURAL', quantity:6, observedAt},
    {externalSku:'POUCH-ZERO', quantity:0, observedAt},
  ]})
  assert.deepEqual(adapter().getInventory({...input, observedAt:'not-utc'}), {ok:false, reason:'INVALID_INPUT'})
  assert.equal(adapter().getInventory({...input, observedAt:'2026-11-28T00:00:00.123456Z'}).ok, true)
  assert.deepEqual(adapter().getInventory({...input, observedAt:`2026-11-28T00:00:00.${'1'.repeat(1024)}Z`}), {ok:false, reason:'INVALID_INPUT'})
  assert.deepEqual(adapter().getInventory({...input, observedAt:'2026-02-30T00:00:00.000Z'}), {ok:false, reason:'INVALID_INPUT'})
  assert.deepEqual(adapter().getInventory({...input, externalSkus:Array(101).fill('POUCH-NATURAL')}), {ok:false, reason:'INVALID_INPUT'})
  const sparseSkus = new Array(2)
  sparseSkus[0] = 'POUCH-ZERO'
  assert.deepEqual(adapter().getInventory({...input, externalSkus:sparseSkus}), {ok:false, reason:'INVALID_INPUT'})
  assert.deepEqual(adapter().getInventory({...input, supplierCode:'unknown'}), {ok:false, reason:'UNKNOWN_SUPPLIER'})
})

test('simulated fulfillment has a stable supplier and request-key reference', () => {
  const input = {supplierCode:north, requestKey:'order-1-fulfillment-1', lines:[{externalSku:'POUCH-NATURAL', quantity:2}]}
  const first = adapter().submitFulfillment(input)
  assert.equal(first.ok, true)
  assert.deepEqual(first, adapter().submitFulfillment(input))
  const differentKey = adapter().submitFulfillment({...input, requestKey:'order-2-fulfillment-1'})
  const differentSupplier = adapter().submitFulfillment({...input, supplierCode:south})
  assert.equal(differentKey.ok, true)
  assert.equal(differentSupplier.ok, true)
  assert.notEqual(first.value.reference, differentKey.value.reference)
  assert.notEqual(first.value.reference, differentSupplier.value.reference)
  assert.deepEqual(adapter().getFulfillmentStatus({supplierCode:north, receipt:first.value}), {ok:true, value:{status:'accepted', simulated:true}})
  assert.deepEqual(adapter().getFulfillmentStatus({supplierCode:south, receipt:first.value}), {ok:false, reason:'INVALID_RECEIPT'})
  assert.deepEqual(adapter().getFulfillmentStatus({supplierCode:north, receipt:{...first.value, reference:'invalid'}}), {ok:false, reason:'INVALID_RECEIPT'})
})

test('invalid fulfillment input and unknown SKU are rejected without acceptance', () => {
  const input = {supplierCode:north, requestKey:'request-1', lines:[{externalSku:'POUCH-NATURAL', quantity:1}]}
  for (const invalid of [
    {...input, requestKey:''}, {...input, lines:[]},
    {...input, lines:new Array(1)},
    {...input, lines:[{externalSku:'POUCH-NATURAL', quantity:0}]},
    {...input, lines:[{externalSku:'POUCH-NATURAL', quantity:1.5}]},
    {...input, lines:[{externalSku:'POUCH-NATURAL', quantity:Number.MAX_SAFE_INTEGER + 1}]},
    {...input, lines:[{externalSku:'', quantity:1}]},
  ]) assert.deepEqual(adapter().submitFulfillment(invalid), {ok:false, reason:'INVALID_INPUT'})
  assert.deepEqual(adapter().submitFulfillment({...input, supplierCode:'unknown'}), {ok:false, reason:'UNKNOWN_SUPPLIER'})
  assert.deepEqual(adapter().submitFulfillment({...input, lines:[{externalSku:'MISSING',quantity:1}]}), {ok:false, reason:'UNKNOWN_SKU'})
})
