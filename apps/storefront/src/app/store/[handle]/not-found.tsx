import StoreState from "../store-state"

export default function ProductNotFound() {
  return <StoreState title="Product not found" message="That product is unavailable in the demo catalog."
    href="/store" label="Browse the catalog" />
}
