# Design system foundation

M0 applies the foundation tokens and text hierarchy to the entry page and catalog. The full M1 design direction below remains provisional.

## Subject and argument

Merqloom-specific inventory: Studio/Store/Console separation; one fictional order observed from shopping to operations; two fulfillment paths; December 7 demo target; native Admin; transparent simulated payments; visible supplier failures; deliberately bounded MVP; Ink/Ivory/Teal/Gold identity; original desk/lifestyle fixtures. No photography or real application screenshot exists yet.

Idea: on this page, Merqloom's single fictional order and two fulfillment paths become the persistent product view beside a readable explanation. One live thing: choose direct or mock supplier to inspect the documented demonstration steps. It must identify planned versus functioning stages, work by keyboard and render both sequences without JavaScript. It is an explanatory interaction, not a fake order-status dashboard.

Argument order: what Merqloom is and its development status; shopper questions; catalog clarity; native operations; direct/supplier differences; intended automation and failure visibility; complete demonstration journey; transparent purchasing; bounded extension architecture; current roadmap; complete FAQ; real next action. Proof comes from approved architecture initially, then actual fixtures and test evidence. Full copy remains in content; no section may imply completed capability without a claim record.

## Direction and pending work

Three dealt options: pinned-poster, page-is-the-object, split-stage. Selected split-stage because a persistent fictional order can connect shopper decisions to operational context without requiring a portfolio of nonexistent photographs. Seed 235165797. No redraws performed.

Retain a balanced desktop split and a readable mobile stack. Generated hero stripe/room-photo and farm-photo suggestions do not match available product assets; these are NOT approved implementation choices. Resolve the hero slot with a documented redraw before UI implementation. The direction remains provisional. At least one full-width moment must break repetition. Do not import unrelated farm photographs into this product demo.

Proposed fonts from the draw: Imbue display and Albert Sans body. Verify font licensing and self-host permitted files before use; use appropriate serif/system-sans fallbacks in the interim. Do not add a third family or invisible remote-font dependency.

## Color roles

Ink #172831 on Ivory #F6F5F0: 13.897:1, normal text passes 4.5:1.
Original Teal #087F73 on Ivory: 4.481:1, normal text fails. Do not round this up to a pass.
Adjusted action Teal #087B70 on Ivory: 4.718:1, normal text passes.
Ink on Gold #D9AA60: 7.129:1, normal text passes.
Gold on Ivory: 1.949:1, fails even large-text contrast.
Ink on original Teal: 3.102:1, insufficient for normal text.

Use Ivory ground, Ink text, adjusted Teal actions and restrained Gold fills with Ink text. Gold is not body text or the sole focus/semantic indicator on Ivory. Actual component opacity, hover, disabled, focus and error states still require rendered contrast testing. Ratios do not certify accessibility.

## Geometry and content

Equal outer margins at every width; mobile 16 to 24 px, desktop 24 to 32 px. Body text at least 16 px with readable line length. Two typefaces and no more than five type sizes. Short section headings, one h1, visible development disclosure in normal text. Preserve the approved long positioning statement as supporting copy if it cannot fit a readable two-line heading; Astra approves final short headline during M1.

Real buttons and links with labels, visible focus, semantic headings, alt text, errors and loading/empty states. No ornamental cards, fake dashboards, gradients, floating pill navigation or decorative badges. Native Admin follows application rules rather than marketing-page rules.

## Motion

Store polish favors Jakub with Emil restraint; Console prioritizes Emil. Feedback may use transform/opacity over approximately 120 to 220 ms when justified. Keyboard-initiated/high-frequency actions update instantly. Reduced motion keeps all content and state changes. No scroll hijacking, mandatory autoplay, parallax, hiding copy until animation or arbitrary motion quotas. Optional illustrative transitions must explain a change of fulfillment path.

## Acceptance evidence

Inspect production UI at 360, 390, 768, 1280 and 1440 px, keyboard and reduced motion. Run taste lint/inspect and inspect every final screenshot; record actual critique and unresolved failures. Use native Admin screenshots only after access works, clearly identified as demo. Record all asset provenance. M0 catalog screenshots are under docs/verification/screens. The full M1 visual critique is pending.

## MQ-101 implementation for review

The split-stage direction keeps the sample products alongside the opening explanation. On this page, the desk tray and organizer pouch become an illustrated guide to the two fulfillment paths. Visitors can open either sequence using native disclosures, including when JavaScript is disabled. The Ink field introduces Store and operations side by side. The warmer journey section gives the demo sequence a separate backdrop.

The hero slot was redrawn from “Striped card beside the room” to “Inset photograph, crossing wordmark” on seed 235165797. The page adapts the inset composition to an original CSS illustration labeled as fictional demo fixtures. Photography and overlaid text were excluded because no verified product photographs exist and the approved geometry requires readable text. The illustration derives from the two seeded desk-accessory concepts. It adds no downloaded images, fonts or other third-party assets. Georgia and the system sans are local fallbacks.

## Astra decision · November 22

Astra approved the two-line “Commerce, connected” headline and original labeled fixture illustrations for Studio. The adjacent copy explains the merchant benefit, and the two illustrated products map directly to the disclosed fulfillment paths. The image-count and still-page findings are accepted for this surface. The Ivory palette, absence of footage and shorter tablet text lines preserve legibility. At 360 px the three-row navigation pushes the art down, but the development notice and catalog action remain usable. Review Store imagery separately under MQ-102.
