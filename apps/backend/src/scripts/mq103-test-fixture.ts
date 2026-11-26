import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from '@medusajs/framework/utils'
import { createInventoryLevelsWorkflow, createProductsWorkflow, updateProductsWorkflow } from '@medusajs/medusa/core-flows'

// Invoked only by the integration test; this product is never part of the normal seed.
export default async function fixture({ container }: { container: MedusaContainer }) {
  const action = process.env.MQ103_FIXTURE_ACTION
  if (action !== 'enable' && action !== 'disable') throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Specify the MQ-103 fixture action.')
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [existing] } = await query.graph({ entity: 'product', fields: ['id', 'handle', 'status'], filters: { handle: 'mq103-fixture-coaster' } })
  if (action === 'disable') {
    if (existing) await updateProductsWorkflow(container).run({ input: { selector: { id: existing.id }, update: { status: ProductStatus.DRAFT } } })
    return
  }
  if (existing) {
    await updateProductsWorkflow(container).run({ input: { selector: { id: existing.id }, update: { status: ProductStatus.PUBLISHED } } })
    return
  }
  const { data: [channel] } = await query.graph({ entity: 'sales_channel', fields: ['id'], filters: { name: 'Default Sales Channel' } })
  const { data: [location] } = await query.graph({ entity: 'stock_location', fields: ['id'], filters: { name: 'Demo warehouse' } })
  const { data: [profile] } = await query.graph({ entity: 'shipping_profile', fields: ['id'] })
  if (!channel || !location || !profile) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'MQ-103 fixture requires the seeded channel, warehouse, and shipping profile.')
  await createProductsWorkflow(container).run({ input: { products: [{
    title: 'Fixture coaster', handle: 'mq103-fixture-coaster', status: ProductStatus.PUBLISHED,
    description: 'Synthetic direct-stock integration fixture.', metadata: { source: 'direct', synthetic: true },
    sales_channels: [{ id: channel.id }], shipping_profile_id: profile.id,
    options: [{ title: 'Finish', values: ['Natural'] }],
    variants: [{ title: 'Natural', sku: 'MQ103-FIXTURE-COASTER', options: { Finish: 'Natural' }, manage_inventory: true, prices: [{ currency_code: 'php', amount: 125 }] }],
  }] } })
  const { data: [item] } = await query.graph({ entity: 'inventory_item', fields: ['id'], filters: { sku: 'MQ103-FIXTURE-COASTER' } })
  if (!item) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'MQ-103 fixture inventory item missing.')
  await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: [{ location_id: location.id, inventory_item_id: item.id, stocked_quantity: 10 }] } })
}
