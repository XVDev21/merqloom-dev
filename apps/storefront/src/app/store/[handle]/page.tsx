import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { catalogHref, demoPrice, fulfillmentSource, getProduct, readFilters, type CatalogFilters, type SearchParams, type Variant } from "../catalog"
import Loading from "../loading"
import ProductImage from "../product-image"
import PendingButton from "../pending-button"
import StoreState from "../store-state"
import styles from "../store.module.css"
import VariantPending from "../variant-pending"

export const metadata: Metadata = { title: "Product details | Merqloom Store" }
export const dynamic = "force-dynamic"

export default async function ProductPage({ params, searchParams }: {
  params: Promise<{ handle: string }>; searchParams: Promise<SearchParams>
}) {
  const [{ handle }, search] = await Promise.all([params, searchParams])
  const filters = readFilters(search)
  const requested = typeof search.variant === "string" ? search.variant.slice(0, 128) : undefined
  const ambiguous = Array.isArray(search.variant)
  return <Suspense key={handle} fallback={<Loading />}>
    <ProductDetails handle={handle} filters={filters} requested={requested} ambiguous={ambiguous} />
  </Suspense>
}

function availability(variant: Variant, supplier: boolean) {
  if (!variant.manage_inventory || typeof variant.inventory_quantity !== "number") {
    return "Stock information unavailable"
  }
  if (variant.inventory_quantity <= 0) return "Out of stock"
  if (supplier) return "Fulfillment unavailable"
  return `${variant.inventory_quantity} available in the demo`
}

async function ProductDetails({ handle, filters, requested, ambiguous }: {
  handle: string; filters: CatalogFilters; requested?: string; ambiguous: boolean
}) {
  const suffix = "/" + encodeURIComponent(handle)
  const product = await getProduct(handle).catch(() => null)
  if (product === null) return <StoreState title="Product details are temporarily unavailable"
    message="The demo product could not be loaded." href={catalogHref(filters, suffix, requested)} label="Retry product" />
  if (!product || product.handle !== handle) notFound()

  const variants = [...(product.variants ?? [])].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "") || a.id.localeCompare(b.id))
  const selected = ambiguous ? undefined : requested === undefined ? variants[0] : variants.find(variant => variant.id === requested)
  const supplier = product.metadata?.source === "supplier"
  const dimensions = [product.length, product.width, product.height].every(value => typeof value === "number" && value > 0)
    ? `${product.length} × ${product.width} × ${product.height} mm`
    : null

  return <>
    <div className={styles.breadcrumb}><Link href={catalogHref(filters)}>Back to catalog</Link>
      {product.collection && <Link href={catalogHref({ q: "", collection: product.collection.handle, page: 1 })}>{product.collection.title}</Link>}
    </div>
    <article className={styles.detail}>
      <figure>
        <ProductImage handle={product.handle} sku={selected?.sku} detail />
      </figure>
      <div className={styles.specs}>
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        <dl className={styles.facts}>
          {dimensions && <div><dt>Dimensions</dt><dd>{dimensions}</dd></div>}
          {product.material && <div><dt>Material</dt><dd>{product.material}</dd></div>}
          <div><dt>Fulfillment</dt><dd>{fulfillmentSource(product)}</dd></div>
        </dl>
        {variants.length > 0 && <div className={styles.selection}>
          <h2 id="finish-options">Choose a finish</h2>
          <div className={styles.variants} role="group" aria-labelledby="finish-options">
            {variants.map((variant, index) => <Link key={variant.id}
              href={catalogHref(filters, suffix, variant.id)} scroll={false} prefetch={false}
              aria-current={selected?.id === variant.id ? "true" : undefined}>
              {variant.options?.[0]?.value ?? variant.title ?? `Finish ${index + 1}`}
              <VariantPending />
            </Link>)}
          </div>
        </div>}
        {selected ? <div className={styles.stock} role="status">
          <p className={styles.price}>{demoPrice(selected) ?? "Demo price unavailable"}</p>
          <p>{availability(selected, supplier)}</p>
        </div> : <p className={styles.stock} role="status">{variants.length
          ? "This finish is unavailable. Choose a listed finish to see its price and stock."
          : "No finishes are available for this product."}</p>}
        {selected && !supplier && product.metadata?.source === "direct" && selected.manage_inventory &&
          typeof selected.inventory_quantity === "number" && selected.inventory_quantity > 0 && demoPrice(selected) &&
          <form className={styles.addToCart} action="/store/cart/action" method="post">
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="handle" value={product.handle} />
            <input type="hidden" name="variant_id" value={selected.id} />
            <label>Quantity <input type="number" name="quantity" min="1" max={selected.inventory_quantity} step="1" defaultValue="1" required /></label>
            <PendingButton pending="Adding…">Add {selected.title} to cart</PendingButton>
          </form>}
        <p className={styles.disclosure}>{supplier
          ? "Product illustration. Supplier fulfillment is planned for this fictional preview."
          : "Product illustration. Prices and stock are for the Philippine demo. Shipping is simulated."}</p>
      </div>
    </article>
  </>
}
