import { NextRequest, NextResponse } from 'next/server'
import { getProduct } from '../../catalog'
import { completeCart, getCart, prepareCart, StoreFailure, type Address, type Cart } from '../../cart-native'
import { redirectForm, sameOrigin } from '../../form-security'
import { readSession, saveSession, withSessionLock } from '../../session'
import { checkoutInput, invalidFields } from '../validation'

async function available(cart: Cart) {
  if (!cart.items?.length || cart.completed_at) return false
  for (const line of cart.items) {
    const product = await getProduct(line.product_handle)
    const variant = product?.variants?.find(item => item.id === line.variant_id)
    if (product?.metadata?.source !== 'direct' || !variant?.manage_inventory ||
      typeof variant.inventory_quantity !== 'number' || variant.inventory_quantity < line.quantity) return false
  }
  return true
}
function paymentMatches(cart: Cart) {
  const collection = cart.payment_collection
  return collection?.currency_code === 'php' && collection.amount === cart.total &&
    collection.payment_sessions?.some(session => session.provider_id === 'pp_system_default' &&
      session.currency_code === 'php' && session.amount === cart.total &&
      ['pending', 'requires_more', 'authorized', 'captured', 'pending_authorization'].includes(session.status))
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse('Forbidden', { status: 403 })
  const redirect = (path: string) => redirectForm(request, path)
  try {
    const form = await request.formData()
    const action = form.get('action')
    const current = await readSession()
    if (!current.token || !current.session?.cartId) return redirect('/store/cart?error=expired')
    const token = current.token
    const result = await withSessionLock(token, async () => {
      const { session } = await readSession()
      if (!session?.cartId) return '/store/cart?error=expired'
      if (session.phase === 'complete') return '/store/confirmation'
      if (action === 'prepare') {
        if (session.phase === 'completing') return '/store/checkout?error=uncertain'
        const input = checkoutInput(form)
        const invalid = invalidFields(input)
        if (invalid.length) return `/store/checkout?invalid=${invalid.join(',')}`
        const cart = await getCart(session.cartId)
        if (!await available(cart)) return '/store/cart?error=unavailable'
        const address: Address = { first_name: input.first_name, last_name: input.last_name, address_1: input.address_1, city: input.city, postal_code: input.postal_code, country_code: 'ph' }
        const prepared = await prepareCart(session.cartId, input.email, address)
        if (!paymentMatches(prepared)) return '/store/checkout?error=payment'
        session.phase = 'ready'
        await saveSession(token, session)
        return '/store/checkout?review=1'
      }
      if (action !== 'complete' || !['ready', 'completing'].includes(session.phase)) return '/store/checkout?error=invalid'
      const alreadyUncertain = session.phase === 'completing'
      if (session.phase === 'ready') {
        const cart = await getCart(session.cartId)
        if (!await available(cart)) { session.phase = 'open'; await saveSession(token, session); return '/store/cart?error=unavailable' }
        if (!paymentMatches(cart)) { session.phase = 'open'; await saveSession(token, session); return '/store/checkout?error=payment' }
        // Persist before the network call: a lost response must never unlock cart mutation.
        session.phase = 'completing'
        await saveSession(token, session)
      }
      try {
        const order = await completeCart(session.cartId)
        if (!order) {
          if (alreadyUncertain) return '/store/checkout?error=uncertain'
          session.phase = 'open'; await saveSession(token, session); return '/store/checkout?error=declined'
        }
        session.phase = 'complete'
        session.order = order
        await saveSession(token, session)
        return '/store/confirmation'
      } catch (error) {
        if (!alreadyUncertain && error instanceof StoreFailure && error.status >= 400 && error.status < 500 && error.status !== 409) {
          session.phase = 'open'
          await saveSession(token, session)
          return '/store/checkout?error=declined'
        }
        return '/store/checkout?error=uncertain'
      }
    })
    return redirect(result.busy ? '/store/checkout?error=busy' : result.value)
  } catch (error) {
    if (error instanceof StoreFailure && error.status === 404) return redirect('/store/cart?error=expired')
    return redirect('/store/checkout?error=service')
  }
}
