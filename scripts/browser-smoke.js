async page => {
  const base = "http://127.0.0.1:18000"
  const screens = "docs/verification/screens"
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const reflow = async width => check(
    await page.evaluate(() => document.documentElement.scrollWidth === innerWidth),
    "Horizontal overflow at " + width
  )
  const focus = async locator => check(await locator.evaluate(el => {
    const style = getComputedStyle(el)
    return el === document.activeElement && style.outlineStyle === "solid" && parseFloat(style.outlineWidth) >= 2
  }), "Expected visible keyboard focus")

  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(base)
    await page.getByRole("heading", { name: "Commerce, connected" }).waitFor()
    await page.getByText(/independent commerce platform in development/i).first().waitFor()
    await reflow(width)
    check(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches &&
      [...document.querySelectorAll("main *, header *, footer *")].every(el => {
        const css = getComputedStyle(el)
        return css.scrollBehavior === "auto" && css.transitionDuration === "0s" && css.animationName === "none"
      })), "Unexpected motion with reduced motion enabled")

    check(await page.evaluate(() => {
      const luminance = color => color.match(/\d+/g).slice(0, 3).map(value => {
        const channel = Number(value) / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
      return [...document.querySelectorAll("main a, header a, footer a, summary")].every(el => {
        const color = getComputedStyle(el).color
        let surface = el
        while (getComputedStyle(surface).backgroundColor === "rgba(0, 0, 0, 0)") {
          surface = surface.parentElement
        }
        const values = [luminance(color), luminance(getComputedStyle(surface).backgroundColor)]
        return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05) >= 4.5
      })
    }), "Studio action text contrast below 4.5:1")
    await page.screenshot({ path: screens + "/studio-" + width + ".png", fullPage: true })
    await page.keyboard.press("Tab")
    await focus(page.getByRole("link", { name: "Skip to content" }))
    await page.keyboard.press("Enter")
    await page.keyboard.press("Tab")
    const catalog = page.getByRole("link", { name: "Explore the demo catalog" }).first()
    await focus(catalog)
    await page.keyboard.press("Enter")
    await page.waitForURL(base + "/store")
    await page.getByRole("heading", { name: "Desk tray" }).waitFor()
    await page.getByRole("heading", { name: "Organizer pouch" }).waitFor()
    await reflow(width)
    await page.getByRole("link", { name: "Merqloom Studio" }).click()
    await page.waitForURL(base + "/")
  }

  // Activate each link individually, including repeated destinations.
  const links = await page.locator("a").evaluateAll(elements => elements.map(el => el.getAttribute("href")))
  for (const [index, href] of links.entries()) {
    await page.goto(base)
    const link = page.locator("a").nth(index)
    if (href === "#studio-content") {
      await page.keyboard.press("Tab")
      await focus(link)
      await page.keyboard.press("Enter")
    } else {
      await link.click()
    }
    if (href.startsWith("#")) {
      await page.waitForURL(base + "/" + href)
      check(await page.locator(href).isVisible(), "Missing anchor " + href)
    } else {
      await page.waitForURL(new URL(href, base).href)
    }
    if (href === "/roadmap") {
      await page.getByRole("heading", { name: "Development roadmap" }).waitFor()
      await page.getByText("December 7, 2026", { exact: true }).waitFor()
      await page.getByRole("link", { name: "Back to Studio" }).click()
      await page.waitForURL(base + "/")
    }
  }

  await page.goto(base + "/roadmap")
  await page.screenshot({ path: screens + "/studio-roadmap-1440.png", fullPage: true })
  await page.getByRole("link", { name: "Explore the demo catalog" }).click()
  await page.waitForURL(base + "/store")
  await page.getByRole("heading", { name: "Desk tray" }).waitFor()

  await page.goto(base)
  for (const disclosure of await page.locator("summary").all()) {
    await disclosure.focus()
    await focus(disclosure)
    await page.keyboard.press("Space")
    check(await disclosure.evaluate(el => el.parentElement.open), "Disclosure did not expand")
    await page.keyboard.press("Enter")
    check(await disclosure.evaluate(el => !el.parentElement.open), "Disclosure did not collapse")
  }
  const noScript = await page.context().browser().newContext({ javaScriptEnabled: false })
  try {
    const fallback = await noScript.newPage()
    await fallback.goto(base)
    for (const name of ["Direct inventory", "Fictional supplier"]) {
      await fallback.locator("summary").getByText(name, { exact: true }).click()
    }
    check(await fallback.locator("details[open]").count() === 2, "Fulfillment comparison needs JavaScript")
  } finally {
    await noScript.close()
  }

  return "Five widths, " + links.length + " Studio links, keyboard disclosures, no-JS and reduced motion passed"
}
