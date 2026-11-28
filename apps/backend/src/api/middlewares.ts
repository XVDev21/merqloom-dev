import { authenticate, defineMiddlewares, errorHandler, getHttpResponseFromError } from '@medusajs/framework/http'
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

// Only fixed strings may leave this mapping: paths and query strings can contain
// cart IDs, payment IDs, or arbitrary customer-supplied data.
const routes: [RegExp, string][] = [
  [/^\/store\/regions$/, '/store/regions'],
  [/^\/store\/products$/, '/store/products'],
  [/^\/store\/products\/[^/]+$/, '/store/products/:id'],
  [/^\/store\/carts$/, '/store/carts'],
  [/^\/store\/carts\/[^/]+$/, '/store/carts/:id'],
  [/^\/store\/carts\/[^/]+\/line-items$/, '/store/carts/:id/line-items'],
  [/^\/store\/carts\/[^/]+\/line-items\/[^/]+$/, '/store/carts/:id/line-items/:line_id'],
  [/^\/store\/carts\/[^/]+\/shipping-methods$/, '/store/carts/:id/shipping-methods'],
  [/^\/store\/carts\/[^/]+\/complete$/, '/store/carts/:id/complete'],
  [/^\/store\/shipping-options$/, '/store/shipping-options'],
  [/^\/store\/payment-collections$/, '/store/payment-collections'],
  [/^\/store\/payment-collections\/[^/]+\/payment-sessions$/, '/store/payment-collections/:id/payment-sessions'],
]

function attachDiagnostic(req: MedusaRequest, res: MedusaResponse) {
  if (res.locals.merqloomDiagnosticAttached) return
  res.locals.merqloomDiagnosticAttached = true
  const path = req.originalUrl.split('?', 1)[0]
  const route = routes.find(([pattern]) => pattern.test(path))?.[1] ?? '/store/:other'
  const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(req.method) ? req.method : 'OTHER'
  res.on('finish', () => {
    const status = Number.isInteger(res.statusCode) && res.statusCode >= 100 && res.statusCode <= 599 ? res.statusCode : 500
    const code = status >= 500 ? 'HTTP_SERVER_ERROR' : status >= 400 ? 'HTTP_CLIENT_ERROR' : 'HTTP_OK'
    process.stdout.write(`${JSON.stringify({ event: 'medusa_http', method, route, status, code })}\n`)
  })
}

const nativeErrorHandler = errorHandler()

export default defineMiddlewares({
  routes: [
    { matcher: '/store/{*splat}', middlewares: [(req, res, next) => { attachDiagnostic(req, res); next() }] },
    { matcher: '/admin/supplier/imports', method:['POST'], bodyParser:{sizeLimit:'512kb'},
      middlewares:[authenticate('user', ['session','bearer'])] },
    { matcher: '/admin/supplier/imports/:id', method:['GET'],
      middlewares:[authenticate('user', ['session','bearer'])] },
  ],
  errorHandler: (error: unknown, req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    if (req.originalUrl.startsWith('/store/')) attachDiagnostic(req, res)
    if (req.scope) { nativeErrorHandler(error, req, res, next); return }
    // The native fallback uses console.error with the raw error when scope is absent.
    const { statusCode, body } = getHttpResponseFromError(error)
    res.status(statusCode).json(body)
  },
})
