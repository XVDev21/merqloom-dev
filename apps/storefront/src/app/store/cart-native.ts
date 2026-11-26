import 'server-only'

import type { StoreRegion } from '@medusajs/types'
import type { OrderSummary } from './session'

export type CartLine = {
  id: string; product_handle: string; variant_id: string; title: string; variant_title: string
  quantity: number; unit_price: number; total: number
}
export type Cart = {
  id: string; completed_at: string | null; items: CartLine[]
  email?: string | null; shipping_address?: Partial<Address> | null
  item_subtotal: number; shipping_total: number; tax_total: number; total: number
  shipping_methods: { shipping_option_id: string }[]
  payment_collection?: { amount: number; currency_code: string; payment_sessions: { amount: number; currency_code: string; provider_id: string; status: string }[] }
}
export type Address = { first_name: string; last_name: string; address_1: string; city: string; postal_code: string; country_code: 'ph' }
type Order = {
  display_id: number; currency_code: string; item_subtotal: number; shipping_total: number; tax_total: number; total: number
  items: { title: string; variant_title: string; quantity: number; total: number }[]
}
export class StoreFailure extends Error {
  constructor(public status: number) { super('Store request failed') }
}

export async function native<T>(resource: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const url = new URL('/store/' + resource, process.env.MEDUSA_BACKEND_URL)
  const response = await fetch(url, {
    method, cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { 'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY ?? '', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
  if (!response.ok) throw new StoreFailure(response.status)
  return response.json() as Promise<T>
}

export async function createCart() {
  const { regions } = await native<{ regions: StoreRegion[] }>('regions')
  const region = regions.find(r => r.currency_code === 'php' && r.countries?.some(c => c.iso_2 === 'ph'))
  if (!region) throw new Error('Philippine region unavailable')
  return (await native<{ cart: Cart }>('carts', { region_id: region.id })).cart
}
export async function getCart(id: string) {
  return (await native<{ cart: Cart }>(`carts/${encodeURIComponent(id)}?fields=%2Bitems.total`)).cart
}
export async function prepareCart(id: string, email: string, address: Address) {
  let { cart } = await native<{ cart: Cart }>(`carts/${id}`, { email, shipping_address: address, billing_address: address })
  const { shipping_options } = await native<{ shipping_options: { id: string; name: string }[] }>(`shipping-options?cart_id=${encodeURIComponent(id)}`)
  const option = shipping_options.find(item => item.name === 'Simulated shipping')
  if (!option) throw new Error('Simulated shipping unavailable')
  if (!cart.shipping_methods?.some(item => item.shipping_option_id === option.id)) {
    ;({ cart } = await native<{ cart: Cart }>(`carts/${id}/shipping-methods`, { option_id: option.id }))
  }
  const { payment_collection } = await native<{ payment_collection: { id: string } }>('payment-collections', { cart_id: id })
  await native(`payment-collections/${payment_collection.id}/payment-sessions`, { provider_id: 'pp_system_default' })
  return getCart(id)
}
export async function completeCart(id: string): Promise<OrderSummary | null> {
  const result = await native<{ type: 'order' | 'cart'; order?: Order }>(`carts/${id}/complete`, {})
  if (result.type !== 'order' || !result.order || result.order.currency_code !== 'php') return null
  const order = result.order
  return {
    displayId: order.display_id,
    items: order.items.map(item => ({ title: item.title, variant: item.variant_title, quantity: item.quantity, total: item.total })),
    itemSubtotal: order.item_subtotal, shippingTotal: order.shipping_total, taxTotal: order.tax_total, total: order.total,
  }
}
export const money = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', currencyDisplay: 'code' }).format(amount)
