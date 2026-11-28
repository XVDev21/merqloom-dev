import type { Database } from './import-audit'

export async function singleManagedItem(db:Database, variantId:string):Promise<string | undefined> {
  const items = await db('product_variant_inventory_item as vi')
    .join('inventory_item as i', 'i.id', 'vi.inventory_item_id')
    .where({'vi.variant_id':variantId}).whereNull('vi.deleted_at').whereNull('i.deleted_at')
    .select('vi.inventory_item_id','vi.required_quantity')
  return items.length === 1 && Number(items[0].required_quantity) === 1 ? items[0].inventory_item_id : undefined
}
