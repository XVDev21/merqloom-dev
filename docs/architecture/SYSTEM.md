# System architecture

Approved direction: modular monolith. M0 implements the commerce backend and two public entry routes.

Next.js hosts Studio and Store as distinct experiences in one public application to limit local memory use. Studio owns `/`; the demo catalog begins at `/store`. It reads published records from the native Store API on the server.

Medusa v2 owns products, variants, prices, collections, sales channels, inventory, reservations, stock locations, carts, payments, orders and fulfillment. PostgreSQL persists these records. Reuse Admin for merchant operations.

Custom supplier module owns supplier identity, external SKU mappings, import runs, timestamped observations and outbound request audit. Link to native variant/order/fulfillment IDs. Do not create competing product, inventory or order ledgers.

Use supported Medusa workflows, subscribers and Redis-backed infrastructure for M2. Redis is not automatically proof of durable workflow configuration. Validate the selected modules, worker mode and restart behavior before accepting M2. No Celery, custom queue service or extra dashboard app.

## Native reuse plan

Catalog, cart, order, inventory, payment lifecycle, manual fulfillment and merchant authentication: native Medusa.
Store presentation, Studio narrative and design tokens: Next.js application code.
Supplier imports/mapping, freshness policy, mock outbound requests, exception view: narrowly scoped extensions.
CI, evidence and claims registry: repository governance.

## Trust boundaries

Store clients never authorize totals or stock. Admin supplier endpoints require native authenticated admin checks. Validate all imports server-side; no secrets or admin tokens in public bundles. No external supplier network path in the mock adapter. Do not equate a mock acknowledgment with a real shipment.

Repository layout: `apps/backend`, `apps/storefront`, `scripts`, `docs` and `content`.
