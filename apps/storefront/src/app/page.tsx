import Link from "next/link"

export default function Studio() {
  return <>
    <header>Merqloom Studio</header>
    <h1>Commerce, connected.</h1>
    <p>Explore the first two sample products in Merqloom’s development catalog. Prices and stock belong to a local demonstration. Payments and shipments are simulated.</p>
    <Link href="/store">Explore the demo catalog</Link>
  </>
}
