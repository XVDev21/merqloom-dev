// A loopback-only fake Store API for isolated production UI state checks.
import { createServer } from "node:http"
import { setTimeout } from "node:timers/promises"

let failNextProductRequest = true
createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1")
  await setTimeout(550)

  if (url.pathname === "/store/collections") {
    response.writeHead(200, { "content-type": "application/json" })
    response.end(JSON.stringify({ collections: [] }))
  } else if (url.pathname === "/store/regions") {
    response.writeHead(200, { "content-type": "application/json" })
    response.end(JSON.stringify({ regions: [{ id: "reg_test", currency_code: "php", countries: [{ iso_2: "ph" }] }] }))
  } else if (url.pathname === "/store/products") {
    const fail = url.searchParams.has("handle") || (url.searchParams.has("q") && failNextProductRequest)
    if (url.searchParams.has("q")) failNextProductRequest = false
    response.writeHead(fail ? 503 : 200, { "content-type": "application/json" })
    response.end(JSON.stringify(fail ? { message: "Synthetic outage" } : { products: [], count: 0 }))
  } else {
    response.writeHead(404).end()
  }
}).listen(19002, "127.0.0.1")
