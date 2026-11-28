# Claims register

## Current public claim policy

Sol owns approval of new copy. Use the [public experience brief](../design/PUBLIC_EXPERIENCE.md#claim-boundaries) to scope claims for the audience and surface. The accepted direct demo covers catalog browsing, finish selection, cart, simulated checkout and authenticated manual fulfillment. [MQ-202](../verification/MQ-202.md) adds authenticated fictional supplier CSV import and stock freshness. The public supplier pouch remains a catalog preview at the MQ-202 baseline. Use the working Store demo as the public action. Development status and dates below are historical or internal material.

## Historical claim decisions

Date: 2026-11-22. Status is scoped to the recorded surface and evidence. Original full copy is retained in ../../content/MERQLOOM_STUDIO_COMPLETE_LANDING_PAGE_COPY.md.

MQ-CL-001. Hero: “A better shopping experience. A clearer way to run commerce.” HYPOTHESIS/POSITIONING. Source: project thesis. Not a comparative or measured result. Approved only with in-development context.
MQ-CL-002. Development disclosure: independent demo with fictional products/payments/suppliers. VERIFIED as project scope, not working software. Must be visible near entry and checkout.
MQ-CL-003. Product discovery and variant selection. VERIFIED for the MQ-102 demo catalog and product pages; native cart and simulated checkout were accepted in MQ-103.
MQ-CL-004. Direct inventory/order visibility. VERIFIED for the fictional direct-stock demo by the accepted MQ-104 lifecycle and [M1 review](../verification/M1_ACCEPTANCE.md#sol-acceptance--november-28).
MQ-CL-005. Supplier coordination/import/synchronization. PLANNED. Requires M2 idempotent import and freshness tests; later label mock behavior SIMULATED.
MQ-CL-006. Automation/retries. PLANNED. Requires durable worker and failure/restart evidence.
MQ-CL-007. Accessible interaction/every screen. DESIGN INTENT, not conformance. Requires measured responsive, keyboard, contrast and motion evidence.
MQ-CL-008. “Less repetitive coordination.” HYPOTHESIS, no quantified savings. Explain intended workflow rather than promise productivity results.
MQ-CL-009. December 7, 2026. TARGET, not launch commitment or completed release.
MQ-CL-010. Architecture extensibility. PLANNED architectural direction; no production readiness implied.
MQ-CL-011. Analytics/measurement. PLANNED. Synthetic clicks cannot prove conversion uplift. No collection service enabled.
MQ-CL-012. Early walkthrough requests. BLOCKED pending a real request channel. Use roadmap instead; omit contact/privacy/terms links without valid destinations.

Rejected: client affiliation, real supplier partnerships, production SaaS availability, conversion uplift, fake reviews/urgency, guaranteed stock/shipping, clinical claims. Historical research does not authorize these claims.

Every implemented section must record exact final claim text, source/fixture/commit, date, audience, limitations and Astra review. Updating wording does not promote implementation status.


## M0 publication review

November 22, Astra. Studio visitors deciding whether to inspect a sample product see “Explore the first two sample products in Merqloom’s development catalog.” VERIFIED by the seed and the two-product browser journey at foundation commit 9ed5bd5. “Explore the demo catalog” opens /store and returns live Medusa records.

The catalog labels both products fictional. The tray and pouch measurements come from the committed fixture descriptions. “Supplier fulfillment is planned” accurately describes the zero-availability supplier preview. The statement that payments and shipments are simulated describes demo scope. M0 has no order submission UI. Functional checkout and fulfillment claims require M1/M2 evidence.

## MQ-101 Studio publication review

November 22, 2026, Manila. Audience assumption from the PRD: independent merchants and technical evaluators deciding whether to inspect one connected demo instead of evaluating separate storefront and operations demos. Their main uncertainty is which steps work today. Sol implemented and checked the copy. Astra’s review is pending. The final wording lives in the [Studio source](../../apps/storefront/src/app/page.tsx) and [roadmap source](../../apps/storefront/src/app/roadmap/page.tsx). Runtime evidence is linked in the [MQ-101 report](../verification/MQ-101.md).

| Surface and published wording | Basis and claim boundary |
| --- | --- |
| Hero and entry notice · “Merqloom is being built to connect what shoppers see with the inventory, orders, and fulfillment merchants manage.” “The demo catalog uses fictional products.” | MQ-CL-001/002. Product positioning from the PRD and development scope. The next sentence marks checkout and supplier flows as planned. |
| Platform and Store · “The public demo catalog reads titles and descriptions, including sample dimensions, from Medusa.” | MQ-CL-003. VERIFIED for browsing only. The running Store rendered the Desk tray and Organizer pouch seeded at accepted foundation `9ed5bd5`. The API verifies PHP 450 and PHP 320. Collections, search, details, variants UI and cart are planned and described accordingly. |
| Operations · “The local foundation uses native Medusa Admin as the authenticated merchant console.” | MQ-CL-004. Foundation acceptance verified native Admin sign-in. MQ-101 verified the running Admin shell and unauthenticated orders response. The direct-order milestone will verify order and inventory behavior. |
| Fulfillment · “The sample desk tray uses merchant stock.” “The organizer pouch is a catalog preview. Supplier ordering and fulfillment are planned.” | MQ-CL-004/005. `MQ-DIRECT-TRAY` and `MQ-SUPPLIER-POUCH` are the fixture SKUs. The initial migration stocks the tray at 12 and the pouch at zero. Both example sequences explicitly describe future demonstrations. |
| Journey · “Today, the public journey reaches the catalog.” | MQ-CL-003/004. Verified by the route and browser round trip. Planned simulated checkout and fulfillment steps remain future milestones. |
| Automation · “Planned automation will process supplier stock updates, coordinate supported order events, and surface failures for investigation and controlled retries.” | MQ-CL-005/006/008. Planned under ADR-002–004. Worker durability, acknowledgments and retry behavior require M2 evidence. |
| Purchasing clarity · “The Store is designed around useful specifications, readable screens, and keyboard navigation.” “Measurement remains a plan.” | MQ-CL-007/011. Design intent. Studio layout and keyboard paths have scoped browser evidence. Future checkout disclosures and analytics remain planned. |
| Architecture · “Next.js serves the public site, and Medusa owns commerce records.” | MQ-CL-010. Verified by ADR-001, source, and the running app. Additional suppliers and other extensions are possibilities. |
| Roadmap and final CTA · “The target for the MVP demonstration is December 7, 2026.” “Explore the roadmap” | MQ-CL-009/012. PRD schedule is a target. The roadmap gives each stage a status and concrete gate. Walkthrough request availability is pending. |
| FAQs and footer · “Commercial pricing is undecided.” “Demo products, suppliers, orders, payments, and shipments are fictional.” | MQ-CL-002/005/009/012. Project boundaries from the PRD. Production providers would require separate approval and validation. |

## Astra decision · November 22

Astra approved the MQ-101 copy at 5d411c3. Current claims are supported by the live catalog and M0 Admin evidence. Checkout and supplier handling are explicitly planned. The catalog CTA and roadmap destination both worked during review.

## MQ-102 Store publication review

November 22, 2026, Manila · Sol · Astra review pending. The assumed fictional shopper wants to decide whether a desk accessory fits and whether the desired finish has stock. They can compare the catalog and product details with the option of leaving the demonstration. The main uncertainty is which finish, price, and fulfillment source apply to the item selected.

- Studio now says “Search the catalog, filter by collection, and see each product’s dimensions, finish, demo price, and stock from Medusa.” Native `q` and collection membership, browser results, and live Product, Region and Inventory values verified this scoped claim under MQ-CL-003. The equivalent roadmap stage now reads “Catalog available.” The Day 5 report records the checks and fixture IDs. [Day 5 evidence](../verification/DAY_05_2026-11-27.md)
- The tray’s “Merchant stock” and the pouch’s “Fictional supplier preview” come from the native products’ fixture source metadata. Medusa reports zero available pouch stock in the seeded sales channel. Supplier ordering and fulfillment remain planned under MQ-CL-005. No Store checkout or delivery promise is made.
- The Philippine demo prices are calculated for the chosen native variant, PHP 450 Natural tray, PHP 520 Walnut tray, and PHP 320 Natural pouch in the test configuration. The view labels shipping as simulated. Cart and checkout remain planned under MQ-103.
- The rendered media depict fictional products and the two sample tray finishes. Image provenance and accessible descriptions are recorded in the [catalog media manifest](../design/CATALOG_MEDIA.md).

## MQ-103 checkout review

November 23, 2026, Manila · Terra · Sol review pending. The fictional shopper can select an available direct-stock tray finish, manage a native cart and complete a simulated checkout. The Store displays Medusa's item subtotal, shipping, tax and total; a demo order is created in Medusa. Payment and shipping remain simulated. The pouch is a browse-only supplier preview. This supports the scoped Studio and roadmap wording in the MQ-103 branch, not a claim of live payments, actual delivery or completed manual fulfillment. [Day 6 evidence](../verification/DAY_06_2026-11-28.md)

## MQ-105 M1 claim review

November 27, 2026, Manila · Terra · IN_REVIEW. The assumed audience is an independent merchant or evaluator deciding what the fictional demo can show today. Their uncertainty is whether the Store order continues into merchant operations. The Studio now says, “The demo follows a direct-stock order from the Store through manual fulfillment in Admin”; the roadmap describes the direct demo as available and payment and shipping as simulated. The accepted [Day 7 lifecycle](../verification/DAY_07_2026-11-29.md) and current [M1 evidence](../verification/M1_ACCEPTANCE.md) support those bounded claims. The supplier path remains planned. This is not a claim of live payment, actual delivery, production readiness, or M1 acceptance; Sol owns the final M1 decision.
