import Link from "next/link"

export const dynamic = "force-dynamic"

type Product = { id: string; title: string; description: string }

export default async function Catalog() {
  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/products?fields=id,title,description`, {
    headers: { "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY ?? "" },
    cache: "no-store",
  })
  if (!response.ok) throw new Error("The demo catalog could not be loaded.")
  const { products }: { products: Product[] } = await response.json()
  return <main>
    <header><Link href="/">Merqloom Studio</Link></header>
    <h1>Demo catalog</h1>
    <p>Fictional desk accessories from the development store.</p>
    {products.length ? <ul>{products.map(product =>
      <li key={product.id}><h2>{product.title}</h2><p>{product.description}</p></li>
    )}</ul> : <p>The catalog is empty.</p>}
  </main>
}
