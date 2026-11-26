/* eslint-disable @next/next/no-html-link-for-pages -- Retry must issue a fresh document request. */
import Link from 'next/link'
import { getCart, money, StoreFailure } from '../cart-native'
import PendingButton from '../pending-button'
import { readSession } from '../session'
import styles from '../store.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cart | Merqloom Store' }

const messages: Record<string, string> = {
  expired: 'This cart is no longer available. Start a new cart to continue.',
  unavailable: 'That item or quantity is no longer available. Check the available stock and try again.',
  quantity: 'Enter a whole quantity of at least one.',
  invalid: 'That cart change could not be applied. Please try again.',
  busy: 'A cart change is already in progress. Please wait and try again.',
  service: 'The demo cart is temporarily unavailable. Please try again.',
}
function Reset() {
  return <form action="/store/cart/action" method="post"><input type="hidden" name="action" value="reset" /><PendingButton>Start a new cart</PendingButton></form>
}
export default async function CartPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const search = await searchParams
  let current: Awaited<ReturnType<typeof readSession>>
  try { current = await readSession() } catch { return <div className={styles.message}><h1>Cart temporarily unavailable</h1><p>Please try again.</p><a href="/store/cart">Retry cart</a></div> }
  if (current.session?.phase === 'complete') return <div className={styles.message}><h1>Order placed</h1><p>Your simulated order is ready to view.</p><Link href="/store/confirmation">View confirmation</Link><Reset /></div>
  if (current.session?.phase === 'completing') return <div className={styles.message}><h1>Order status pending</h1><p>Keep this cart while we check your simulated order.</p><Link href="/store/checkout">Check order status</Link></div>
  let cart
  try { cart = current.session?.cartId ? await getCart(current.session.cartId) : undefined } catch (error) {
    if (error instanceof StoreFailure && error.status === 404) return <div className={styles.message}><h1>Cart unavailable</h1><p>This cart has expired or is no longer available.</p><Reset /></div>
    return <div className={styles.message}><h1>Cart temporarily unavailable</h1><p>Please try again.</p><a href="/store/cart">Retry cart</a></div>
  }
  if (current.expired || cart?.completed_at) return <div className={styles.message}><h1>Cart unavailable</h1><p>This cart has expired or is no longer available.</p><Reset /></div>
  return <section className={styles.commerce}>
    <div className={styles.breadcrumb}><Link href="/store">Continue browsing</Link></div>
    <h1>Your cart</h1>
    <p>Fictional products for the Philippine demo. Payment and shipping are simulated.</p>
    {search.error && messages[search.error] && <p className={styles.error} role="alert">{messages[search.error]}</p>}
    {search.notice === 'updated' && <p role="status" className={styles.notice}>Cart updated.</p>}
    {!cart?.items?.length ? <div className={styles.empty}><h2>Your cart is empty</h2><p>Choose an available tray finish to begin.</p><Link href="/store/desk-tray">View desk tray</Link></div> :
      <div className={styles.commerceGrid}>
        <div><ul className={styles.cartList}>{cart.items.map(item => <li key={item.id}>
          <div className={styles.lineHeading}><div><h2>{item.title}</h2><p>{item.variant_title}</p></div><strong>{money(item.total)}</strong></div>
          <div className={styles.lineActions}>
            <form action="/store/cart/action" method="post"><input type="hidden" name="action" value="update" /><input type="hidden" name="line_id" value={item.id} /><label>Quantity <input type="number" name="quantity" min="1" step="1" defaultValue={item.quantity} required /></label><PendingButton pending="Updating…">Update</PendingButton></form>
            <form action="/store/cart/action" method="post"><input type="hidden" name="action" value="remove" /><input type="hidden" name="line_id" value={item.id} /><PendingButton pending="Removing…">Remove {item.title} {item.variant_title}</PendingButton></form>
          </div>
        </li>)}</ul></div>
        <aside className={styles.summary}><h2>Order summary</h2><dl><div><dt>Items</dt><dd>{money(cart.item_subtotal)}</dd></div><div><dt>Shipping</dt><dd>{cart.shipping_methods?.length ? money(cart.shipping_total) : 'Calculated at checkout'}</dd></div><div><dt>Tax</dt><dd>{money(cart.tax_total)}</dd></div><div><dt>Total</dt><dd>{money(cart.total)}</dd></div></dl><Link className={styles.primary} href="/store/checkout">Continue to simulated checkout</Link></aside>
      </div>}
  </section>
}
