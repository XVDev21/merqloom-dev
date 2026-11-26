import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from '@medusajs/framework/utils'
import { createInventoryLevelsWorkflow, createProductsWorkflow, updateProductsWorkflow } from '@medusajs/medusa/core-flows'

// Each disposable test run gets its own direct-stock fixture; the normal seed is unchanged.
export default async function fixture({ container }: { container: MedusaContainer }) {
  const action = process.env.MQ104_FIXTURE_ACTION
  const suffix = process.env.MQ104_FIXTURE_SUFFIX ?? ''
  if (!/^[a-f0-9]{12}$/.test(suffix) || !['create', 'draft'].includes(action ?? '')) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid MQ-104 fixture request.')
  }
  const handle = `mq104-fixture-tray-${suffix}`
  const sku = `MQ104-FIXTURE-${suffix}`
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [existing] } = await query.graph({ entity: 'product', fields: ['id'], filters: { handle } })
  if (action === 'draft') {
    if (existing) await updateProductsWorkflow(container).run({ input: { selector: { id: existing.id }, update: { status: ProductStatus.DRAFT } } })
    return
  }
  if (existing) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'MQ-104 fixture already exists.')
  const { data: [channel] } = await query.graph({ entity: 'sales_channel', fields: ['id'], filters: { name: 'Default Sales Channel' } })
  const { data: [location] } = await query.graph({ entity: 'stock_location', fields: ['id'], filters: { name: 'Demo warehouse' } })
  const { data: [profile] } = await query.graph({ entity: 'shipping_profile', fields: ['id'] })
  if (!channel || !location || !profile) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'MQ-104 fixture requires the seeded channel, warehouse and shipping profile.')
  await createProductsWorkflow(container).run({ input: { products: [{
    title: 'Fixture tray', handle, status: ProductStatus.PUBLISHED,
    description: 'Synthetic direct-stock fulfillment fixture.', metadata: { source: 'direct', synthetic: true },
    sales_channels: [{ id: channel.id }], shipping_profile_id: profile.id,
    options: [{ title: 'Finish', values: ['Natural'] }],
    variants: [{ title: 'Natural', sku, options: { Finish: 'Natural' }, manage_inventory: true, prices: [{ currency_code: 'php', amount: 450 }] }],
  }] } })
  const { data: [item] } = await query.graph({ entity: 'inventory_item', fields: ['id'], filters: { sku } })
  if (!item) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'MQ-104 fixture inventory item missing.')
  await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: [{ location_id: location.id, inventory_item_id: item.id, stocked_quantity: 3 }] } })
}
