async page => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("http://127.0.0.1:18000")
    const catalog = page.getByRole("link", { name: "Explore the demo catalog" })
    await page.keyboard.press("Tab")
    if (!await catalog.evaluate(el => el === document.activeElement)) {
      throw new Error("Catalog link must receive keyboard focus")
    }
    await page.keyboard.press("Enter")
    await page.getByRole("heading", { name: "Desk tray" }).waitFor()
    await page.getByRole("heading", { name: "Organizer pouch" }).waitFor()
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
      throw new Error("Horizontal overflow at " + width)
    }
    await page.screenshot({ path: "docs/verification/screens/catalog-" + width + ".png" })
    await page.getByRole("link", { name: "Merqloom Studio" }).click()
    await page.getByRole("heading", { name: "Commerce, connected." }).waitFor()
  }
  return "Keyboard round trips, native catalog and reduced motion passed at three widths"
}
