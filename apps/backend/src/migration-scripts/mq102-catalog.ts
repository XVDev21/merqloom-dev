import type { MedusaContainer } from "@medusajs/framework"
import type { ProductOptionDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductVariantsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

const collectionHandle = "desk-organization"
const walnutSku = "MQ-DIRECT-TRAY-WALNUT"
const walnutFinish = "Walnut"

const specs = {
  "desk-tray": { length: 240, width: 160, height: 25, material: "Birch" },
  "organizer-pouch": { length: 220, width: 140, height: 30, material: "Canvas" },
} as const

export default async function upgradeCatalog({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "collection_id", "length", "width", "height", "material", "options.id", "options.title"],
    filters: { handle: Object.keys(specs) },
  })
  const tray = products.find(product => product.handle === "desk-tray")
  const pouch = products.find(product => product.handle === "organizer-pouch")
  const options: Array<Pick<ProductOptionDTO, "id" | "title"> | null> = tray?.options ?? []
  const finish = options.find(option => option?.title === "Finish")
  if (!tray || !pouch || !finish) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "MQ-102 requires the seeded tray, pouch, and tray Finish option.")
  }

  const { data: [existingCollection] } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
    filters: { handle: collectionHandle },
  })
  if (tray.collection_id && tray.collection_id !== existingCollection?.id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The demo tray already belongs to a different collection.")
  }
  const collection = existingCollection ?? (await createCollectionsWorkflow(container).run({
    input: { collections: [{ title: "Desk organization", handle: collectionHandle }] },
  })).result[0]

  for (const [product, spec] of [[tray, specs["desk-tray"]], [pouch, specs["organizer-pouch"]]] as const) {
    // Fill absent fixture attributes and preserve merchant edits on a repeat run.
    const update = {
      ...(product.length == null && { length: spec.length }),
      ...(product.width == null && { width: spec.width }),
      ...(product.height == null && { height: spec.height }),
      ...(product.material == null && { material: spec.material }),
      ...(product.id === tray.id && !product.collection_id && { collection_id: collection.id }),
    }
    if (Object.keys(update).length) {
      await updateProductsWorkflow(container).run({ input: { selector: { id: product.id }, update } })
    }
  }

  const { data: [walnut] } = await query.graph({
    entity: "product_variant",
    fields: ["id", "product_id"],
    filters: { sku: walnutSku },
  })
  if (walnut && walnut.product_id !== tray.id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The Walnut fixture SKU belongs to a different product.")
  }

  if (!walnut) {
    const productService = container.resolve(Modules.PRODUCT)
    const [existingValue] = await productService.listProductOptionValues({
      option_id: finish.id,
      value: walnutFinish,
    })
    // Medusa allows a product to use a subset of the Finish option's values.
    await productService.updateProductOptionValuesOnProduct({
      product_id: tray.id,
      product_option_id: finish.id,
      add: [existingValue?.id ?? { value: walnutFinish }],
    })
    await createProductVariantsWorkflow(container).run({
      input: {
        product_variants: [{
          product_id: tray.id,
          title: walnutFinish,
          sku: walnutSku,
          options: { Finish: walnutFinish },
          manage_inventory: true,
          allow_backorder: false,
          prices: [{ currency_code: "php", amount: 520 }],
        }],
      },
    })
  }

  const { data: [item] } = await query.graph({
    entity: "inventory_item", fields: ["id"], filters: { sku: walnutSku },
  })
  if (!item) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "MQ-102 could not find the Walnut inventory item.")
  }

  // An existing level anywhere, including a deliberately removed level, is inventory history.
  const levels = await container.resolve(Modules.INVENTORY).listInventoryLevels(
    { inventory_item_id: item.id }, { select: ["id"], take: 1, withDeleted: true },
  )
  if (levels.length) return

  const { data: [location] } = await query.graph({
    entity: "stock_location", fields: ["id"], filters: { name: "Demo warehouse" },
  })
  if (!location) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "MQ-102 could not find the demo warehouse.")
  }
  await createInventoryLevelsWorkflow(container).run({
    input: { inventory_levels: [{ location_id: location.id, inventory_item_id: item.id, stocked_quantity: 6 }] },
  })
}
