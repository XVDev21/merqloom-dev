import { readFileSync } from "node:fs"
import { parseEnv } from "node:util"
import { test } from "node:test"
import assert from "node:assert/strict"

const { MEDUSA_PUBLISHABLE_KEY, MEDUSA_BACKEND_URL } =
  parseEnv(readFileSync("apps/storefront/.env.local", "utf8"))
assert.equal(MEDUSA_BACKEND_URL, "http://127.0.0.1:19000")

const storefront = "http://127.0.0.1:18000"
const headers = { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY }

async function store(path, params = {}) {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/store/${path}?${new URLSearchParams(params)}`, { headers })
  assert.equal(response.status, 200)
  return response.json()
}

async function catalogHtml(path) {
  const response = await fetch(storefront + path)
  assert.equal(response.status, 200)
  return response.text()
}

test("native Philippine prices and channel inventory follow each selected variant", async () => {
  const { regions } = await store("regions")
  const region = regions.find(item => item.currency_code === "php" && item.countries.some(country => country.iso_2 === "ph"))
  assert.ok(region)
  const { products } = await store("products", {
    region_id: region.id,
    fields: "handle,variants.id,variants.sku,variants.inventory_quantity,*variants.calculated_price",
  })
  const variants = Object.fromEntries(products.flatMap(product => product.variants.map(variant => [variant.sku, variant])))
  for (const [sku, price] of [["MQ-DIRECT-TRAY", 450], ["MQ-DIRECT-TRAY-WALNUT", 520], ["MQ-SUPPLIER-POUCH", 320]]) {
    assert.equal(variants[sku]?.calculated_price.calculated_amount, price)
    assert.equal(variants[sku].calculated_price.currency_code, "php")
  }
  assert.equal(variants["MQ-SUPPLIER-POUCH"].inventory_quantity, 0)

  const walnut = variants["MQ-DIRECT-TRAY-WALNUT"]
  const selected = await catalogHtml(`/store/desk-tray?variant=${walnut.id}`)
  assert.match(selected, /PHP\s520\.00/)
  const walnutStock = walnut.inventory_quantity > 0
    ? new RegExp(`${walnut.inventory_quantity} available in the demo`)
    : /Out of stock/
  assert.match(selected, walnutStock)
  assert.match(selected, /240 × 160 × 25 mm/)
  for (const id of ["variant_missing", variants["MQ-SUPPLIER-POUCH"].id]) {
    const invalid = await catalogHtml(`/store/desk-tray?variant=${id}`)
    assert.match(invalid, /This finish is unavailable/)
    assert.doesNotMatch(invalid, /<img\b[^>]*alt="Illustration of a [^"]*desk tray/i)
    assert.doesNotMatch(invalid, /PHP\s(?:450|520)\.00/)
  }
  const pouch = await catalogHtml("/store/organizer-pouch")
  assert.match(pouch, /PHP\s320\.00/)
  assert.match(pouch, /Out of stock/)
  assert.match(pouch, /Fictional supplier preview/)
})

test("native collection and query narrow the public list and allow recovery", async () => {
  const { collections } = await store("collections", { handle: "desk-organization" })
  assert.equal(collections.length, 1)
  const params = { "collection_id[]": collections[0].id, fields: "handle" }
  const { products } = await store("products", { ...params, q: "desk tray" })
  assert.deepEqual(products.map(product => product.handle), ["desk-tray"])
  const { count } = await store("products", { ...params, q: "pouch" })
  assert.equal(count, 0)
  const filtered = await catalogHtml("/store?q=desk+tray&collection=desk-organization")
  assert.match(filtered, /\/store\/desk-tray/)
  assert.doesNotMatch(filtered, /\/store\/organizer-pouch/)
  assert.match(await catalogHtml("/store?q=pouch&collection=desk-organization"), /No products match/)
  assert.match(await catalogHtml("/store?collection=missing"), /Collection unavailable/)
})

test("merchant data requires authentication", async () => {
  const response = await fetch(MEDUSA_BACKEND_URL + "/admin/orders")
  assert.equal(response.status, 401)
})

test("the Studio links to a server-rendered native catalog", async () => {
  for (const [path, content] of [["/", 'href="/store"'], ["/store", "Desk tray"], ["/store", "Organizer pouch"]]) {
    const response = await fetch("http://127.0.0.1:18000" + path)
    assert.equal(response.status, 200)
    assert.ok((await response.text()).includes(content))
  }
})
