async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  await page.context().clearCookies()
  await page.setViewportSize({width:1280,height:900})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('http://127.0.0.1:18000/store/desk-tray')
  await page.getByRole('link', {name:'Natural'}).click()
  await page.getByRole('button', {name:'Add Natural to cart'}).click()
  await page.waitForURL('**/store/cart**')
  await page.getByRole('link', {name:'Continue to simulated checkout'}).click()
  await page.getByLabel('Email').fill('fulfillment@example.test')
  await page.getByLabel('First name').fill('Demo')
  await page.getByLabel('Last name').fill('Shopper')
  await page.getByLabel('Street address').fill('1 Fictional Street')
  await page.getByLabel('City or municipality').fill('Makati')
  await page.getByLabel('Philippine postal code').fill('1200')
  await page.getByRole('button', {name:'Review simulated order'}).click()
  await page.getByRole('heading', {name:'Review your demo order'}).waitFor()
  await page.getByRole('button', {name:'Place simulated order — payment and shipping simulated'}).click()
  await page.waitForURL('**/store/confirmation')
  await page.getByRole('heading', {name:'Simulated order placed'}).waitFor()
  const text = await page.locator('main').innerText()
  const display = text.match(/Demo order #(\d+)/)?.[1]
  check(display && /Natural × 1/.test(text) && /PHP\s460\.00/.test(text), 'Expected the one-tray simulated confirmation')
  check(/Payment and shipping are simulated/.test(text), 'Expected the simulated disclosure')
  await page.screenshot({path:'docs/verification/screens/mq104-store-confirmation.png', fullPage:true})
  return `Synthetic demo order #${display}: Natural × 1, total PHP 460; payment and shipping simulated.`
}
