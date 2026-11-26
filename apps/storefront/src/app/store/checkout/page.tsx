/* eslint-disable @next/next/no-html-link-for-pages -- Retry must issue a fresh document request. */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCart, money, StoreFailure } from '../cart-native'
import PendingButton from '../pending-button'
import { readSession } from '../session'
import styles from '../store.module.css'
import CheckoutForm from './checkout-form'
import { checkoutFields, type CheckoutField } from './validation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Simulated checkout | Merqloom Store' }
const errors: Record<string, string> = {
  uncertain: 'Your order may still be processing. Check its status using the same cart.',
  busy: 'An order request is already processing. Please wait, then check its status.',
  service: 'Checkout is temporarily unavailable. Please try again.',
  payment: 'The simulated payment could not be prepared for this total. Please try again.',
  declined: 'The demo order could not be completed. Review your cart and details before trying again.',
  invalid: 'Review your details before placing the simulated order.',
}
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ invalid?: string; error?: string; edit?: string }> }) {
  const search = await searchParams
  let current: Awaited<ReturnType<typeof readSession>>
  try { current = await readSession() } catch { return <div className={styles.message}><h1>Checkout temporarily unavailable</h1><p>Please try again.</p><a href="/store/checkout">Retry checkout</a></div> }
  if (!current.session?.cartId) redirect('/store/cart?error=expired')
  if (current.session.phase === 'complete') redirect('/store/confirmation')
  let cart
  try { cart = await getCart(current.session.cartId) } catch (error) {
    if (error instanceof StoreFailure && error.status === 404 && current.session.phase !== 'completing') redirect('/store/cart?error=expired')
    if (current.session.phase === 'completing') return <div className={styles.message}><h1>Order status pending</h1><p>Keep this cart while we check whether the simulated order was placed.</p><form action="/store/checkout/action" method="post"><input type="hidden" name="action" value="complete" /><PendingButton pending="Checking…">Check simulated order status</PendingButton></form></div>
    return <div className={styles.message}><h1>Checkout temporarily unavailable</h1><p>Keep this cart and try again.</p><a href="/store/checkout">Retry checkout</a></div>
  }
  const invalid = (search.invalid ?? '').split(',').filter((name): name is CheckoutField => checkoutFields.includes(name as CheckoutField))
  const locked = current.session.phase === 'completing'
  const review = current.session.phase === 'ready' && search.edit !== '1'
  if (!cart.items?.length && !locked) redirect('/store/cart')
  return <section className={styles.commerce}>
    <div className={styles.breadcrumb}><Link href="/store/cart">Back to cart</Link></div>
    <h1>Simulated checkout</h1>
    <p>Use fictional contact and Philippine address details. No payment is collected and nothing will be shipped.</p>
    {search.error && errors[search.error] && <p className={styles.error} role="alert">{errors[search.error]}</p>}
    <div className={styles.commerceGrid}>
      <div>
        {locked ? <div className={styles.checkoutForm}><h2>Check your order</h2><p>The result is not yet confirmed. Retrying checks the same cart and will not create a replacement.</p><form action="/store/checkout/action" method="post"><input type="hidden" name="action" value="complete" /><PendingButton pending="Checking…">Check simulated order status</PendingButton></form></div> :
        review ? <div className={styles.checkoutForm}><h2>Review your demo order</h2><p>Simulated payment and simulated shipping: no charge or delivery will take place.</p><p><Link href="/store/checkout?edit=1">Edit contact and address</Link></p><form action="/store/checkout/action" method="post"><input type="hidden" name="action" value="complete" /><PendingButton pending="Placing simulated order…">Place simulated order — payment and shipping simulated</PendingButton></form></div> :
        <CheckoutForm initialInvalid={invalid} initialValues={{ email: cart.email ?? '', first_name: cart.shipping_address?.first_name ?? '', last_name: cart.shipping_address?.last_name ?? '', address_1: cart.shipping_address?.address_1 ?? '', city: cart.shipping_address?.city ?? '', postal_code: cart.shipping_address?.postal_code ?? '' }} />}
      </div>
      <aside className={styles.summary}><h2>Order summary</h2><ul>{cart.items?.map(item => <li key={item.id}>{item.title} · {item.variant_title} × {item.quantity} <strong>{money(item.total)}</strong></li>)}</ul><dl><div><dt>Items</dt><dd>{money(cart.item_subtotal)}</dd></div><div><dt>Simulated shipping</dt><dd>{cart.shipping_methods?.length ? money(cart.shipping_total) : 'Calculated after address'}</dd></div><div><dt>Tax</dt><dd>{money(cart.tax_total)}</dd></div><div><dt>Total</dt><dd>{money(cart.total)}</dd></div></dl></aside>
    </div>
  </section>
}
