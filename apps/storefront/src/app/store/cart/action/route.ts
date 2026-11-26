import { NextRequest, NextResponse } from 'next/server'
import { redirectForm, sameOrigin } from '../../form-security'
import { getProduct } from '../../catalog'
import { createCart, getCart, native, StoreFailure } from '../../cart-native'
import { clearSession, createSession, readSession, saveSession, withSessionLock } from '../../session'

const redirect = redirectForm
const safeQuantity = (value: FormDataEntryValue | null) => {
  const input = typeof value === 'string' ? value : ''
  const number = Number(input)
  return /^[1-9]\d*$/.test(input) && Number.isSafeInteger(number) && number <= 999 ? number : null
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse('Forbidden', { status: 403 })
  try {
    const form = await request.formData()
    const action = form.get('action')
    let current = await readSession()
    if (action === 'reset') {
      if (!current.token || !current.session) {
        await clearSession(current.token)
        return redirect(request, '/store/cart?notice=reset')
      }
      const token = current.token
      const reset = await withSessionLock(token, async () => {
        const { session } = await readSession()
        if (session?.phase === 'completing') return '/store/checkout?error=uncertain'
        await clearSession(token)
        return '/store/cart?notice=reset'
      })
      return redirect(request, reset.busy ? '/store/cart?error=busy' : reset.value)
    }
    if (!['add', 'update', 'remove'].includes(String(action))) return redirect(request, '/store/cart?error=invalid')
    if (current.expired) return redirect(request, '/store/cart?error=expired')
    if (!current.session && action !== 'add') return redirect(request, '/store/cart?error=expired')

    const quantity = action === 'remove' ? null : safeQuantity(form.get('quantity'))
    if (action !== 'remove' && quantity === null) return redirect(request, '/store/cart?error=quantity')
    const handle = String(form.get('handle') ?? '')
    const variantId = String(form.get('variant_id') ?? '')
    if (action === 'add') {
      if (!/^[a-z0-9-]{1,128}$/.test(handle) || !/^variant_[A-Za-z0-9]+$/.test(variantId)) return redirect(request, '/store/cart?error=unavailable')
      const product = await getProduct(handle)
      const variant = product?.variants?.find(item => item.id === variantId)
      if (!product || product.handle !== handle || product.metadata?.source !== 'direct' || !variant?.manage_inventory ||
        typeof variant.inventory_quantity !== 'number' || variant.inventory_quantity < quantity! || !variant.calculated_price) {
        return redirect(request, '/store/cart?error=unavailable')
      }
    }
    if (!current.session) current = { ...await createSession(), expired: false }
    const token = current.token!
    const result = await withSessionLock(token, async () => {
      const { session } = await readSession()
      if (!session) return '/store/cart?error=expired'
      if (session.phase === 'completing') return '/store/checkout?error=uncertain'
      if (session.phase === 'complete') return '/store/confirmation'
      if (!session.cartId) {
        if (action !== 'add') return '/store/cart?error=expired'
        const cart = await createCart()
        session.cartId = cart.id
        await saveSession(token, session)
      }
      const cart = await getCart(session.cartId)
      if (cart.completed_at) return '/store/cart?error=expired'
      if (action === 'add') {
        const product = await getProduct(handle)
        const variant = product?.variants?.find(item => item.id === variantId)
        const existing = cart.items?.filter(item => item.variant_id === variantId).reduce((sum, item) => sum + item.quantity, 0) ?? 0
        if (product?.metadata?.source !== 'direct' || !variant?.manage_inventory ||
          typeof variant.inventory_quantity !== 'number' || existing + quantity! > variant.inventory_quantity) return '/store/cart?error=unavailable'
        await native(`carts/${session.cartId}/line-items`, { variant_id: variantId, quantity })
      } else {
        const lineId = String(form.get('line_id') ?? '')
        const line = cart.items?.find(item => item.id === lineId)
        if (!line) return '/store/cart?error=invalid'
        if (action === 'update') {
          const product = await getProduct(line.product_handle)
          const variant = product?.variants?.find(item => item.id === line.variant_id)
          if (product?.metadata?.source !== 'direct' || !variant?.manage_inventory ||
            typeof variant.inventory_quantity !== 'number' || quantity! > variant.inventory_quantity) return '/store/cart?error=unavailable'
          await native(`carts/${session.cartId}/line-items/${line.id}`, { quantity })
        } else {
          await native(`carts/${session.cartId}/line-items/${line.id}`, undefined, 'DELETE')
        }
      }
      session.phase = 'open'
      await saveSession(token, session)
      return '/store/cart?notice=updated'
    })
    return redirect(request, result.busy ? '/store/cart?error=busy' : result.value)
  } catch (error) {
    if (error instanceof StoreFailure && error.status === 404) return redirect(request, '/store/cart?error=expired')
    if (error instanceof StoreFailure && error.status >= 400 && error.status < 500) return redirect(request, '/store/cart?error=unavailable')
    return redirect(request, '/store/cart?error=service')
  }
}
