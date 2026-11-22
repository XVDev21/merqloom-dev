import "server-only"

import type { StoreCollection, StoreProduct, StoreProductVariant, StoreRegion } from "@medusajs/types"

export type SearchParams = Record<string, string | string[] | undefined>
export type CatalogFilters = { q: string; collection: string; page: number }

export type Variant = Pick<StoreProductVariant, "id" | "title" | "sku" | "inventory_quantity" | "manage_inventory"> & {
  calculated_price?: { currency_code: string; calculated_amount: number } | null
  options?: { value: string }[]
}

export type Product = Pick<StoreProduct, "id" | "title" | "handle" | "description" | "material" | "length" | "width" | "height" | "metadata"> & {
  variants?: Variant[]
  collection?: Collection | null
}

type Collection = Pick<StoreCollection, "id" | "title" | "handle">
const pageSize = 12
const maxCollections = 100
const listFields = "id,title,handle,description,metadata,collection.id,collection.handle,collection.title"
const detailFields = listFields + ",material,length,width,height,variants.id,variants.title,variants.sku,variants.manage_inventory,variants.inventory_quantity,variants.options.value,*variants.calculated_price"

async function storeRequest<T>(resource: string, params: Record<string, string>): Promise<T> {
  const url = new URL("/store/" + resource, process.env.MEDUSA_BACKEND_URL)
  url.search = new URLSearchParams(params).toString()
  const response = await fetch(url, {
    headers: { "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY ?? "" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`Store API ${resource} returned ${response.status}`)
  return response.json() as Promise<T>
}

export function readFilters(params: SearchParams): CatalogFilters {
  const page = typeof params.page === "string" ? Number(params.page) : 1
  return {
    q: typeof params.q === "string" ? params.q.trim().slice(0, 100) : "",
    collection: typeof params.collection === "string" ? params.collection.slice(0, 128) : "",
    page: Number.isSafeInteger(page) && page > 1 && page <= 10_000 ? page : 1,
  }
}

export function catalogHref(filters: CatalogFilters, suffix = "", variant?: string) {
  const query = new URLSearchParams()
  if (filters.q) query.set("q", filters.q)
  if (filters.collection) query.set("collection", filters.collection)
  if (filters.page > 1) query.set("page", String(filters.page))
  if (variant) query.set("variant", variant)
  return "/store" + suffix + (query.size ? `?${query}` : "")
}

export async function getCatalog(filters: CatalogFilters) {
  const { collections } = await storeRequest<{ collections: Collection[] }>("collections", {
    fields: "id,title,handle",
    limit: String(maxCollections),
    order: "title",
  })
  const collection = collections.find(item => item.handle === filters.collection)
  if (filters.collection && !collection) {
    return { collections, invalidCollection: true, products: [], count: 0, pageSize }
  }
  const { products, count } = await storeRequest<{ products: Product[]; count: number }>("products", {
    fields: listFields,
    limit: String(pageSize),
    offset: String((filters.page - 1) * pageSize),
    order: "handle",
    ...(filters.q && { q: filters.q }),
    ...(collection && { "collection_id[]": collection.id }),
  })
  return { collections, invalidCollection: false, products, count, pageSize }
}

export async function getProduct(handle: string) {
  const { regions } = await storeRequest<{ regions: StoreRegion[] }>("regions", {
    fields: "id,currency_code,*countries",
    currency_code: "php",
  })
  const region = regions.find(item => item.currency_code === "php" &&
    item.countries?.some(country => country.iso_2 === "ph"))
  if (!region) throw new Error("The Philippine demo region is unavailable.")

  const { products: [product] } = await storeRequest<{ products: Product[] }>("products", {
    handle,
    fields: detailFields,
    region_id: region.id,
    limit: "1",
  })
  return product
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", currencyDisplay: "code" })

export function demoPrice(variant: Variant) {
  const price = variant.calculated_price
  return price?.currency_code === "php" && Number.isFinite(price.calculated_amount)
    ? peso.format(price.calculated_amount)
    : null
}

export function fulfillmentSource(product: Product) {
  if (product.metadata?.source === "direct") return "Merchant stock"
  if (product.metadata?.source === "supplier") return "Fictional supplier preview"
  return "Fulfillment source unavailable"
}
