import { readFileSync } from "node:fs"
import { parseEnv } from "node:util"
import { test } from "node:test"
import assert from "node:assert/strict"

const { MEDUSA_PUBLISHABLE_KEY, MEDUSA_BACKEND_URL } =
  parseEnv(readFileSync("apps/storefront/.env.local", "utf8"))
assert.equal(MEDUSA_BACKEND_URL, "http://127.0.0.1:19000")

test("Medusa serves the seeded PHP catalog to the storefront", async () => {
  const headers = { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY }
  const regions = await fetch(MEDUSA_BACKEND_URL + "/store/regions", { headers })
  assert.equal(regions.status, 200)
  const { regions: [region] } = await regions.json()
  assert.equal(region.currency_code, "php")
  const params = new URLSearchParams({ region_id: region.id, fields: "title,*variants.calculated_price,variants.sku" })
  const response = await fetch(MEDUSA_BACKEND_URL + "/store/products?" + params, { headers })
  assert.equal(response.status, 200)
  const { products } = await response.json()
  const prices = Object.fromEntries(products.flatMap(p => p.variants.map(v =>
    [v.sku, v.calculated_price.calculated_amount])))
  assert.equal(prices["MQ-DIRECT-TRAY"], 450)
  assert.equal(prices["MQ-SUPPLIER-POUCH"], 320)
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
