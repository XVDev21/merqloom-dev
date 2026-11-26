/* eslint-disable @next/next/no-html-link-for-pages -- Retry must issue a fresh document request. */
import Link from 'next/link'
import { money } from '../cart-native'
import PendingButton from '../pending-button'
import { readSession } from '../session'
import styles from '../store.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Order confirmation | Merqloom Store' }
export default async function Confirmation() {
  let current: Awaited<ReturnType<typeof readSession>>
  try { current = await readSession() } catch { return <div className={styles.message}><h1>Confirmation temporarily unavailable</h1><p>Please try again.</p><a href="/store/confirmation">Retry confirmation</a></div> }
  const order = current.session?.phase === 'complete' ? current.session.order : undefined
  if (!order) return <div className={styles.message}><h1>No confirmed order in this session</h1><p>If an order is still processing, return to checkout to check its status.</p><Link href="/store/checkout">Go to checkout</Link></div>
  return <section className={styles.commerce}><h1>Simulated order placed</h1><p>Demo order #{order.displayId} was created in Medusa. Payment and shipping are simulated: no charge or delivery will take place.</p>
    <div className={styles.confirmation}><h2>Order summary</h2><ul>{order.items.map((item, index) => <li key={index}>{item.title} · {item.variant} × {item.quantity} <strong>{money(item.total)}</strong></li>)}</ul><dl><div><dt>Items</dt><dd>{money(order.itemSubtotal)}</dd></div><div><dt>Simulated shipping</dt><dd>{money(order.shippingTotal)}</dd></div><div><dt>Tax</dt><dd>{money(order.taxTotal)}</dd></div><div><dt>Total</dt><dd>{money(order.total)}</dd></div></dl></div>
    <form action="/store/cart/action" method="post"><input type="hidden" name="action" value="reset" /><PendingButton>Start a new cart</PendingButton></form>
  </section>
}
