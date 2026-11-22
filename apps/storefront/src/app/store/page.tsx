import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { Suspense } from "react"
import { catalogHref, fulfillmentSource, getCatalog, readFilters, type CatalogFilters, type SearchParams } from "./catalog"
import Loading from "./loading"
import ProductImage from "./product-image"
import StoreState from "./store-state"
import styles from "./store.module.css"

export const metadata: Metadata = {
  title: "Demo catalog | Merqloom Store",
  description: "Browse fictional desk accessories and compare sample finishes and dimensions.",
}
export const dynamic = "force-dynamic"

export default async function Catalog({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = readFilters(await searchParams)
  return <Suspense key={catalogHref(filters)} fallback={<Loading />}>
    <CatalogResults filters={filters} />
  </Suspense>
}

async function CatalogResults({ filters }: { filters: CatalogFilters }) {
  const results = await getCatalog(filters).catch(() => null)
  if (!results) return <StoreState title="The Store is temporarily unavailable"
    message="The demo catalog could not be loaded." href={catalogHref(filters)} label="Retry catalog" />

  const { collections, products, count, pageSize, invalidCollection } = results
  const emptyTitle = invalidCollection ? "Collection unavailable" : count ? "Page unavailable"
    : filters.q || filters.collection ? "No products match" : "The catalog is empty"
  return <>
    <div className={styles.catalogIntro}>
      <h1>Demo catalog</h1>
      <p>Fictional desk accessories. Compare fit, finishes, and stock in the Philippine demo.</p>
    </div>
    <Form action="/store" className={styles.filters} role="search" key={catalogHref(filters)}>
      <label>Search products
        <input name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Try desk tray" />
      </label>
      <label>Collection
        <select name="collection" defaultValue={invalidCollection ? "" : filters.collection}>
          <option value="">All products</option>
          {collections.map(collection => <option key={collection.id} value={collection.handle}>{collection.title}</option>)}
        </select>
      </label>
      <button type="submit">Apply filters</button>
      {(filters.q || filters.collection || filters.page > 1) && <Link href="/store">Clear filters</Link>}
    </Form>
    {products.length ? <>
      <p className={styles.resultCount} role="status">{count} {count === 1 ? "product" : "products"}</p>
      <ul className={styles.grid}>
        {products.map(product => <li key={product.id}>
          <article>
            <Link className={styles.productLink} aria-labelledby={`product-${product.id}`} href={catalogHref(filters, "/" + encodeURIComponent(product.handle))}>
              <ProductImage handle={product.handle} />
              <h2 id={`product-${product.id}`}>{product.title}</h2>
            </Link>
            <p>{fulfillmentSource(product)}</p>
          </article>
        </li>)}
      </ul>
      {count > pageSize && <nav className={styles.pagination} aria-label="Catalog pages">
        {filters.page > 1 && <Link href={catalogHref({ ...filters, page: filters.page - 1 })}>Previous page</Link>}
        <span>Page {filters.page} of {Math.ceil(count / pageSize)}</span>
        {filters.page < Math.min(10_000, Math.ceil(count / pageSize)) &&
          <Link href={catalogHref({ ...filters, page: filters.page + 1 })}>Next page</Link>}
      </nav>}
    </> : <div className={styles.empty} role="status">
      <h2>{emptyTitle}</h2>
      <p>{filters.q || filters.collection || filters.page > 1
        ? "Clear the filters or try a different search."
        : "Check back when sample products are available."}</p>
      {filters.q || filters.collection || filters.page > 1
        ? <Link href="/store">Browse all products</Link>
        : <a href={catalogHref(filters)}>Reload catalog</a>}
    </div>}
  </>
}
