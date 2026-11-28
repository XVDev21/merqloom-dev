# Merqloom public experience

The public content policy applies to subsequent frontend work. UX-001 is approved for release. The visual direction remains a proposal for UX-002. The baseline is accepted MQ-202 at `e8797905b170cc3fcfe9578a7124c75b1a25c0b0` on `main`.

## Audience and activation

Assume an independent merchant or client evaluator wants to see whether one shop can connect the customer experience to order handling before investing time in a walkthrough. Their alternative is inspecting separate storefront and operations examples. Build the story around a real sequence they can try.

Proposed hero headline: **From storefront to fulfillment.** Supporting copy: “Browse a sample store, place a demo order, and see what happens on the merchant side.” Primary action: **Try the demo store** → `/store`. A secondary in-page link can explain the workflow. Use a short entry note: “Fictional products. No charges or deliveries.” Confirm the headline wraps to no more than two lines and the demo action is visible on a narrow phone in the implemented composition.

The story follows the same desk tray from Natural or Walnut finish selection to a simulated receipt and authenticated manual fulfillment. Use real, sanitized fixture captures from the working Store and merchant view for proof. The live interaction is the existing demo Store. If Studio offers a finish preview, reuse the real fixture media and provide links to the working product page without JavaScript. Merchant-side examples on Studio are static, labeled demo captures. Purchasing starts in the Store.

## Claim boundaries

| Verified evidence | Public treatment |
| --- | --- |
| Catalog, collection filtering, finish selection and direct cart | Show sample products, matching illustrations, authoritative PHP prices and stock. Explain the next action in shopper terms. |
| Simulated payment, shipping and session-bound order confirmation | Disclose simulation at demo entry, before order submission and on confirmation. Ask for fictional details in checkout. Keep the totals and the merchant's actual fulfillment step clear. |
| Direct order and manual fulfillment in authenticated Admin | Show what the merchant can see and do using sanitized synthetic examples. Public visitors follow storefront links. |
| Authenticated fictional supplier CSV import and stock freshness, accepted in MQ-202 | Show the pouch as a catalog preview with “Not available to order in this demo.” Publish supplier checkout or fulfillment claims only after Sol accepts the corresponding end-to-end capability. Label any later mock supplier operation as simulated. |

Use the [claims register](../conversion/CLAIMS_REGISTER.md) and [M1 acceptance](../verification/M1_ACCEPTANCE.md) as evidence. Remove engineering schedules, roadmap links, task references and implementation details from visible copy and metadata. Keep dates and technical notes in the repository. Publish customer proof, pricing, production availability, guarantees and contact actions only when supported and approved.

## Proposed visual direction

Use the large, image-led masthead and aligned editorial columns from the Design Taste “printed annual” draw, seed `859940669`. Merqloom's own object and its order trail are the masthead: a large desk-tray image shares the spread with a compact product-detail or receipt crop. Continue the story across three views of the same order, then close with the demo action. Replace the template's architecture imagery and overlapping panels with original fixture illustrations and real interface crops. Preserve legibility and show the demo action early on mobile.

- Keep Ivory and Ink dominant. Keep action Teal `#087B70`. Reserve Gold for an occasional background or product accent with Ink text. Verify rendered contrast, including errors and focus. Derive Store and Studio from the same existing CSS token source.
- Trial Bricolage Grotesque as a single self-hosted variable face for editorial headings and interface labels, with a system fallback. Verify licensing, font bytes and layout stability first. Use short headings, consistent page edges and tabular figures for price comparisons and totals.
- Use one wordmark and icon, one action hierarchy, and consistent form, focus, empty, unavailable and recovery treatments. Let native inputs and headings carry meaning. Keep product imagery the focus in browse views and reduce decoration in the cart and checkout.
- Keep the 150 ms hover/disclosure feedback where useful. Use a restrained image crossfade only when it explains an actual finish change. Preserve instant keyboard, form and price updates, and show the final state under reduced motion. Skip decorative looping animation and scroll effects.

The [woven M icon concept](merqloom-mark-concept.png) draws from the loom in Merqloom. Two broad bands interlace to represent the storefront and merchant workflow. It is a generated design study. Refine the silhouette to read unmistakably as an M, then verify it at 16, 32 and 64 px on light and dark backgrounds before exporting favicon, app icon and a wordmark lockup. This study lives with the design brief and is separate from shipped assets.

The reference set uses image-led merchandising from [Squarespace Commerce](https://www.squarespace.com/ecommerce/designs-that-sell) and the [Shopify Editions theme](https://themes.shopify.com/themes/editions/presets/editions). Baymard's checkout research informs the distinction between review and confirmation, visible totals and actionable validation. [Baymard checkout research](https://baymard.com/blog/checkout-flow-ux-optimization)

## Route plan

| Surface | Proposed change |
| --- | --- |
| `/` Studio | Replace development notice, roadmap CTAs and implementation-led sections with the product story, working demo action, verified operations evidence and decision-focused FAQ. Update title and descriptions. |
| `/roadmap` | Remove links and public roadmap content. Preserve old bookmarks with a permanent redirect to Studio. Update browser coverage to assert both the redirect and absence of public roadmap navigation. |
| `/store` and shared layout | Put the sample products first, simplify the visual hierarchy of search and filters, and apply the shared wordmark, navigation and footer. Keep search/filter/pagination and their URL state intact. |
| `/store/[handle]` | Keep finish-specific imagery, variant URLs, PHP price, stock, specs, quantity and cart eligibility intact. Make the reaction to unavailable or invalid finishes clear. Use browse-only wording for the pouch while its purchase gate is closed. |
| Cart, checkout, review and confirmation | Keep the current server-owned amounts, validation, session isolation, reconciliation and retries. Style a consistent summary and make these states visibly distinct. Place simulation terms before submission and on receipt. |
| Loading, empty, retry and missing-product states | Use customer-facing wording and a useful next action. Keep semantic feedback, keyboard focus and navigation. |
| Future merchant interfaces | Apply the shared type, palette and state conventions to custom screens. Keep existing native Admin access and avoid reskinning the platform for this initiative. |

## Audit notes and verification gate

The baseline Studio leads with a development notice and a prominent roadmap link. In the 390 px capture the illustration starts below the first screen. Shared Store footer copy and loading and confirmation text still expose implementation details. The three highest-impact changes are a shorter opening with an earlier demo action, product and order proof in place of development sections, and a shared visual hierarchy across Studio and Store.

Taste source lint reported zero failures and warnings. The Studio inspector at 390, 768 and 1440 px reported two failures for picture count and motion count and three warnings for palette, footage and tablet margins. The local development build also displayed the framework's dev indicator. Review the tablet alignment and strengthen the visual proof. Retain the accepted brand color and purposeful-motion policy. Record any intentional exceptions against the implemented production page.

Playwright inspected public routes with read-only requests. The Studio CTA reached `/store` and the native disclosure opened by keyboard with JavaScript disabled. The retained runtime rendered service-error states for catalog and product detail, so the normal commerce audit used source and previously accepted screenshots. No new order or database change was made. Recheck the complete journey on a healthy disposable stack when implementing.

Before accepting implementation, take before/after screenshots from production builds at 360, 390, 768, 1280 and 1440 px. Verify keyboard focus and order, reduced motion, no-JS fallbacks, reflow, contrast and meaningful error/loading/empty states. Check WCAG 2.2 AA criteria applicable to the affected surfaces. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Run lint, typecheck, production builds, affected Playwright journeys and exact-head Foundation and Compose checks. Use isolated synthetic data to prove browse, variant selection, cart edits, validation, review, same-cart retry and confirmation authorization. Preserve visual and functional coverage on direct orders and verify the supplier gate against the branch baseline. Measure mobile lab LCP, CLS and page bytes under the same conditions as MQ-301. Record exceptions and any measured regressions with Sol's acceptance decision.

## Release sequence

The owner approved [UX-001 public copy and routing](../handoffs/TERRA_UX-001_PUBLIC_COPY_AND_ROUTING.md) as Terra's next assignment and put MQ-203 on hold. Review the copy contract and old-URL redirect first. Release the [visual implementation](../roadmap/TASKS.md#ux-002-shared-frontend-design-and-brand) separately, reviewing Studio and the shared shell before carrying the treatment into catalog, product details and checkout. Aim to include accepted work in MQ-302's demo capture as capacity permits. Keep the December 7 MVP gate and MQ-301 performance obligations independent of optional visual polish.
