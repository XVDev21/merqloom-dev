async page => {
  const url = "http://127.0.0.1:18002"
  const delay = { waitUntil: "commit" }
  await page.goto(url + "/store", delay)
  await page.getByRole("heading", { name: "Loading the Store" }).waitFor()
  await page.getByRole("heading", { name: "The catalog is empty" }).waitFor()
  await page.getByRole("link", { name: "Reload catalog" }).click()
  await page.getByRole("heading", { name: "The catalog is empty" }).waitFor()

  await page.goto(url + "/store?q=desk")
  await page.getByRole("heading", { name: "The Store is temporarily unavailable" }).waitFor()
  await page.getByRole("link", { name: "Retry catalog" }).click()
  await page.getByRole("heading", { name: "No products match" }).waitFor()
  if (new URL(page.url()).searchParams.get("q") !== "desk") throw new Error("Retry lost the query")

  await page.goto(url + "/store/desk-tray?variant=variant_test")
  await page.getByRole("heading", { name: "Product details are temporarily unavailable" }).waitFor()
  const retry = page.getByRole("link", { name: "Retry product" })
  if (await retry.getAttribute("href") !== "/store/desk-tray?variant=variant_test") throw new Error("Retry lost the variant")
  await retry.click()
  await page.getByRole("heading", { name: "Product details are temporarily unavailable" }).waitFor()
  return "Loading, empty catalog, temporary catalog failure and recovery, and product failure passed"
}
