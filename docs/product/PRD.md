# Product requirements

Decision date: 2026-11-22. Owner: Astra. Architecture approved in principle; implementation and milestone acceptance pending.

## Audience and decision

Hypothesis: an independent merchant or technical evaluator wants to inspect how product discovery connects to fulfillment before choosing whether a walkthrough is worthwhile. Their alternative is evaluating disconnected storefront and operations demos; uncertainty is whether the workflow actually works.

Shopper persona: fictional shopper evaluating dimensions, variants, availability and demo totals. Operator persona: authorized demo merchant inspecting products, inventory, orders and supplier failures. Reviewer persona: developer or prospective customer replaying both demonstration journeys. These are design hypotheses, not interviewed customers.

## Must have

1. Studio at the public root: complete truthful product story, roadmap, functional links and development disclosure.
2. Store: at least two synthetic lifestyle SKUs, native product variants/prices, catalog, simple supported search/filter, product detail, cart and simulated checkout.
3. Direct flow: product to cart to a real Medusa demo order, then supported manual fulfillment visible in Admin with observed inventory behavior.
4. Supplier flow: validated fictional CSV to mapping to native catalog and inventory to separate supplier order to durable mock processing to status and retry visibility in Admin.
5. Native Medusa Admin, with only supplier-specific extensions.
6. Accessible keyboard controls, responsive layouts, reduced motion, error states and accurate totals.
7. Reproducible local environment, deterministic data, integration and browser tests, CI, verified pushes and evidence-based review.

## Catalog contract

Seeded fixtures: MQ-DIRECT-TRAY, 240 × 160 × 25 mm, PHP 450, 12 units. MQ-SUPPLIER-POUCH, 220 × 140 × 30 mm, PHP 320, zero available units. Both have a Natural finish. These are fictional specifications.

Seeded demo region: Philippines, PHP, explicitly simulated shipping/tax settings. This is a demo configuration decision, not tax advice or a production policy. The migration selects the system payment provider and manual fulfillment.

## Boundaries

No live payments, raw card collection, actual shipping or supplier calls, multi-tenant SaaS, paid hosting, public deployment, medical catalog, copied brand assets, invented customers or measured growth claims. Mixed direct/supplier carts are excluded and must be rejected server-side once supplier products become purchasable.

## Acceptance

M0: installed official scaffold, isolated services, storefront/Admin access, seed, checks, committed and remotely verified foundation, actual CI, finalized Sol packet.
M1: Studio plus catalog/cart/checkout and direct order/fulfillment, negative stock and duplicate-action coverage.
M2: idempotent imports, freshness, durable retries, supplier order and authorized Console visibility, with M1 regression passing.
M3: clean reproduction, accessibility/security review, both demonstrations, remote SHA and release decision.

Schedule and execution state are maintained in [TASKS.md](../roadmap/TASKS.md); passing calendar dates cannot establish acceptance.
